import { Decimal } from "../../generated/prisma/internal/prismaNamespace.js";

import {
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from "../../generated/prisma/client.js";

import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

import {
  getNextPaymentStatus,
  getPaymentProvider,
} from "./payment.service.js";

import type {
  CreatePaymentRefundInput,
} from "./payment-refund.validation.js";


type PaymentProviderMetadata = {
  paymentAmount: string;
  paymentCurrency: string;
};


type RefundRequestType =
  | "FULL"
  | "PARTIAL";


type RefundClaim = {
  refundId: string;
  paymentId: string;

  provider: PaymentProvider;

  providerPaymentId: string;

  status: RefundStatus;

  amount: string;
  currency: string;

  idempotencyKey: string;

  reason: string;
  adminNote: string | null;

  requestType: RefundRequestType;
};


function getPaymentProviderMetadata(
  metadata: unknown,
): PaymentProviderMetadata {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    throw new AppError(
      500,
      "PAYMENT_METADATA_INVALID",
      "Payment provider metadata is missing or invalid",
    );
  }

  const record =
    metadata as Record<string, unknown>;

  const paymentAmount =
    typeof record.paymentAmount === "string"
      ? record.paymentAmount
      : null;

  const paymentCurrency =
    typeof record.paymentCurrency === "string"
      ? record.paymentCurrency
      : null;

  if (!paymentAmount || !paymentCurrency) {
    throw new AppError(
      500,
      "PAYMENT_METADATA_INVALID",
      "Payment provider amount or currency is missing",
    );
  }

  return {
    paymentAmount,
    paymentCurrency,
  };
}


function parsePositiveMoney(
  value: string,
  code: string,
  message: string,
): Decimal {
  let amount: Decimal;

  try {
    amount = new Decimal(value);
  } catch {
    throw new AppError(
      400,
      code,
      message,
    );
  }

  if (amount.lte(0)) {
    throw new AppError(
      400,
      code,
      message,
    );
  }

  return amount;
}


function getRefundMetadataRecord(
  metadata: unknown,
): Record<string, unknown> {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return {};
  }

  return metadata as Record<string, unknown>;
}


function getRefundRequestType(
  metadata: unknown,
): RefundRequestType | null {
  const record =
    getRefundMetadataRecord(metadata);

  if (
    record.requestType === "FULL" ||
    record.requestType === "PARTIAL"
  ) {
    return record.requestType;
  }

  return null;
}


function normalizeAdminNote(
  value: string | null | undefined,
): string | null {
  return value ?? null;
}


function assertIdempotentRefundRequest(
  refund: {
    amount: Decimal;
    reason: string;
    adminNote: string | null;
    metadata: unknown;
  },
  input: CreatePaymentRefundInput,
) {
  const storedRequestType =
    getRefundRequestType(
      refund.metadata,
    );

  if (!storedRequestType) {
    throw new AppError(
      409,
      "REFUND_IDEMPOTENCY_CONFLICT",
      "Refund idempotency key is associated with a refund whose original request cannot be verified",
    );
  }

  const incomingRequestType:
    RefundRequestType =
      input.amount
        ? "PARTIAL"
        : "FULL";

  if (
    storedRequestType !==
    incomingRequestType
  ) {
    throw new AppError(
      409,
      "REFUND_IDEMPOTENCY_CONFLICT",
      "Refund idempotency key was reused with a different refund request",
    );
  }

  if (
    refund.reason !== input.reason ||
    refund.adminNote !==
      normalizeAdminNote(
        input.adminNote,
      )
  ) {
    throw new AppError(
      409,
      "REFUND_IDEMPOTENCY_CONFLICT",
      "Refund idempotency key was reused with different refund details",
    );
  }

  if (
    incomingRequestType ===
    "PARTIAL"
  ) {
    const incomingAmount =
      parsePositiveMoney(
        input.amount!,
        "INVALID_REFUND_AMOUNT",
        "Refund amount must be greater than zero",
      );

    if (
      !refund.amount.eq(
        incomingAmount,
      )
    ) {
      throw new AppError(
        409,
        "REFUND_IDEMPOTENCY_CONFLICT",
        "Refund idempotency key was reused with a different refund amount",
      );
    }
  }
}


function toRefundClaim(
  refund: {
    id: string;
    paymentId: string;
    status: RefundStatus;
    amount: Decimal;
    currency: string;
    idempotencyKey: string;
    reason: string;
    adminNote: string | null;
    metadata: unknown;
  },
  provider: PaymentProvider,
  providerPaymentId: string,
): RefundClaim {
  const requestType =
    getRefundRequestType(
      refund.metadata,
    );

  if (!requestType) {
    throw new AppError(
      409,
      "REFUND_REQUEST_METADATA_MISSING",
      "Refund request metadata is missing or invalid",
    );
  }

  return {
    refundId: refund.id,
    paymentId: refund.paymentId,

    provider,
    providerPaymentId,

    status: refund.status,

    amount:
      refund.amount.toFixed(2),

    currency:
      refund.currency,

    idempotencyKey:
      refund.idempotencyKey,

    reason:
      refund.reason,

    adminNote:
      refund.adminNote,

    requestType,
  };
}


async function synchronizeCompletedRefund(
  claim: RefundClaim,
  providerRefundId: string,
  providerStatus: string,
  providerIdempotencyKey: string,
) {
  return prisma.$transaction(
    async (tx) => {
      /*
       * Serialize refund synchronization for the Payment.
       *
       * API retries and refund webhooks can therefore converge
       * on the same aggregate Payment state.
       */
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${claim.paymentId}, 0)
        )
      `;

      const currentRefund =
        await tx.paymentRefund.findUnique({
          where: {
            id: claim.refundId,
          },
        });

      if (!currentRefund) {
        throw new AppError(
          404,
          "PAYMENT_REFUND_NOT_FOUND",
          "Refund record was not found",
        );
      }

      /*
       * Repeated provider confirmation for an already completed
       * refund is an idempotent no-op.
       */
      if (
        currentRefund.status ===
        RefundStatus.COMPLETED
      ) {
        if (
          currentRefund.providerRefundId &&
          currentRefund.providerRefundId !==
            providerRefundId
        ) {
          throw new AppError(
            409,
            "REFUND_PROVIDER_ID_CONFLICT",
            "Refund is already associated with another provider refund ID",
          );
        }
      } else {
        if (
          currentRefund.status ===
          RefundStatus.FAILED
        ) {
          throw new AppError(
            409,
            "REFUND_STATE_CONFLICT",
            "A failed refund cannot be changed to completed",
          );
        }

        await tx.paymentRefund.update({
          where: {
            id: currentRefund.id,
          },

          data: {
            status:
              RefundStatus.COMPLETED,

            providerRefundId,

            completedAt:
              new Date(),

            metadata: {
              requestType:
                claim.requestType,

              providerStatus,
              providerIdempotencyKey,
            },
          },
        });
      }

      const payment =
        await tx.payment.findUnique({
          where: {
            id: claim.paymentId,
          },

          include: {
            refunds: {
              where: {
                status:
                  RefundStatus.COMPLETED,
              },
            },
          },
        });

      if (!payment) {
        throw new AppError(
          404,
          "PAYMENT_NOT_FOUND",
          "Payment was not found while refund was being synchronized",
        );
      }

      const {
        paymentAmount,
      } = getPaymentProviderMetadata(
        payment.metadata,
      );

      const originalAmount =
        parsePositiveMoney(
          paymentAmount,
          "PAYMENT_PROVIDER_AMOUNT_INVALID",
          "Stored provider payment amount is invalid",
        );

      const completedRefundTotal =
        payment.refunds.reduce(
          (total, refund) =>
            total.add(refund.amount),
          new Decimal(0),
        );

      if (
        completedRefundTotal.gt(
          originalAmount,
        )
      ) {
        throw new AppError(
          409,
          "PAYMENT_REFUND_TOTAL_INVALID",
          "Completed refunds exceed the original provider payment amount",
        );
      }

      const nextPaymentStatus =
        completedRefundTotal.eq(
          originalAmount,
        )
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      if (
        payment.status !==
          PaymentStatus.COMPLETED &&
        payment.status !==
          PaymentStatus.PARTIALLY_REFUNDED &&
        payment.status !==
          PaymentStatus.REFUNDED
      ) {
        throw new AppError(
          409,
          "PAYMENT_REFUND_STATE_CONFLICT",
          `Payment cannot synchronize a completed refund while its status is ${payment.status}`,
        );
      }

      /*
       * REFUNDED is terminal. If aggregate financial truth says
       * otherwise, treat that as an invariant violation rather
       * than attempting to move backwards.
       */
      if (
        payment.status ===
          PaymentStatus.REFUNDED &&
        nextPaymentStatus !==
          PaymentStatus.REFUNDED
      ) {
        throw new AppError(
          409,
          "PAYMENT_REFUND_STATE_CONFLICT",
          "Refunded payment cannot return to a partially refunded state",
        );
      }

      if (
        payment.status !==
        nextPaymentStatus
      ) {
        const synchronizedStatus =
          getNextPaymentStatus(
            payment.status,
            nextPaymentStatus,
          );

        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status:
              synchronizedStatus,
          },
        });
      }

      const synchronizedRefund =
        await tx.paymentRefund
          .findUniqueOrThrow({
            where: {
              id: claim.refundId,
            },
          });

      return {
        refundId:
          synchronizedRefund.id,

        paymentId:
          synchronizedRefund.paymentId,

        status:
          synchronizedRefund.status,

        providerRefundId:
          synchronizedRefund
            .providerRefundId,

        amount:
          synchronizedRefund.amount
            .toFixed(2),

        currency:
          synchronizedRefund.currency,

        reason:
          synchronizedRefund.reason,

        adminNote:
          synchronizedRefund.adminNote,

        paymentStatus:
          nextPaymentStatus,

        totalRefunded:
          completedRefundTotal
            .toFixed(2),

        originalAmount:
          originalAmount.toFixed(2),
      };
    },
  );
}


async function executeRefundClaim(
  claim: RefundClaim,
) {
  /*
   * A completed local refund must never cause another provider
   * refund request.
   */
  if (
    claim.status ===
    RefundStatus.COMPLETED
  ) {
    const refund =
      await prisma.paymentRefund
        .findUniqueOrThrow({
          where: {
            id: claim.refundId,
          },
        });

    const payment =
      await prisma.payment
        .findUniqueOrThrow({
          where: {
            id: claim.paymentId,
          },
        });

    return {
      refundId:
        refund.id,

      paymentId:
        refund.paymentId,

      status:
        refund.status,

      providerRefundId:
        refund.providerRefundId,

      amount:
        refund.amount.toFixed(2),

      currency:
        refund.currency,

      reason:
        refund.reason,

      adminNote:
        refund.adminNote,

      paymentStatus:
        payment.status,
    };
  }

  /*
   * A provider-confirmed failed refund is terminal for this
   * particular PaymentRefund record.
   */
  if (
    claim.status ===
    RefundStatus.FAILED
  ) {
    const refund =
      await prisma.paymentRefund
        .findUniqueOrThrow({
          where: {
            id: claim.refundId,
          },
        });

    return {
      refundId:
        refund.id,

      paymentId:
        refund.paymentId,

      status:
        refund.status,

      providerRefundId:
        refund.providerRefundId,

      amount:
        refund.amount.toFixed(2),

      currency:
        refund.currency,

      reason:
        refund.reason,

      adminNote:
        refund.adminNote,
    };
  }

  const provider =
    getPaymentProvider(
      claim.provider,
    );

  /*
  * Stable provider-side idempotency identity.
  *
  * If ClothingMart loses the response after the payment
  * provider accepts a refund, retrying this durable claim
  * reuses exactly the same provider idempotency key.
  */
  const providerIdempotencyKey =
    `payment-refund-${claim.refundId}`;

  let providerRefund;

  try {
    providerRefund =
      await provider.refundPayment({
        providerPaymentId:
          claim.providerPaymentId,

        amount:
          claim.amount,

        currency:
          claim.currency,

        idempotencyKey:
          providerIdempotencyKey,
      });
  } catch {
    /*
    * Provider outcome is uncertain.
    *
    * Never mark this refund FAILED merely because ClothingMart
    * did not receive a response. The provider may already have
    * processed it.
    *
    * PENDING continues reserving this amount, and retrying the
    * same application idempotency key resumes this exact claim.
    */
    throw new AppError(
      502,
      "REFUND_PROVIDER_OUTCOME_UNCERTAIN",
      "The refund outcome could not be confirmed. Retry the same refund request using the same idempotency key.",
    );
  }

  if (
    !providerRefund.providerRefundId
  ) {
    throw new AppError(
      502,
      "REFUND_PROVIDER_RESPONSE_INVALID",
      "Payment provider did not return a refund ID",
    );
  }

  /*
   * Compare monetary values numerically instead of comparing
   * strings such as "10.0" and "10.00".
   */
  if (providerRefund.amount) {
    let providerAmount: Decimal;

    try {
      providerAmount =
        new Decimal(
          providerRefund.amount,
        );
    } catch {
      throw new AppError(
        502,
        "REFUND_PROVIDER_AMOUNT_INVALID",
        "Payment provider returned an invalid refund amount",
      );
    }

    if (
      !providerAmount.eq(
        new Decimal(claim.amount),
      )
    ) {
      throw new AppError(
        502,
        "REFUND_PROVIDER_AMOUNT_MISMATCH",
        "Payment provider refund amount does not match the requested amount",
      );
    }
  }

  if (
    providerRefund.currency &&
    providerRefund.currency
      .toUpperCase() !==
      claim.currency.toUpperCase()
  ) {
    throw new AppError(
      502,
      "REFUND_PROVIDER_CURRENCY_MISMATCH",
      "Payment provider refund currency does not match the requested currency",
    );
  }

  const providerStatus =
    providerRefund.status
      ?.toUpperCase();

  if (
    providerStatus !== "COMPLETED" &&
    providerStatus !== "PENDING" &&
    providerStatus !== "FAILED" &&
    providerStatus !== "CANCELLED"
  ) {
    throw new AppError(
      502,
      "REFUND_PROVIDER_STATUS_UNKNOWN",
      `Payment provider returned an unsupported refund status: ${providerRefund.status ?? "UNKNOWN"}`,
    );
  }

  if (
    providerStatus === "PENDING"
  ) {
    const pendingRefund =
      await prisma.paymentRefund.update({
        where: {
          id: claim.refundId,
        },

        data: {
          providerRefundId:
            providerRefund
              .providerRefundId,

          metadata: {
            requestType:
              claim.requestType,

            providerStatus,
            providerIdempotencyKey,
          },
        },
      });

    return {
      refundId:
        pendingRefund.id,

      paymentId:
        pendingRefund.paymentId,

      status:
        pendingRefund.status,

      providerRefundId:
        pendingRefund
          .providerRefundId,

      amount:
        pendingRefund.amount
          .toFixed(2),

      currency:
        pendingRefund.currency,

      reason:
        pendingRefund.reason,

      adminNote:
        pendingRefund.adminNote,
    };
  }

  if (
    providerStatus === "FAILED" ||
    providerStatus === "CANCELLED"
  ) {
    const failedRefund =
      await prisma.paymentRefund.update({
        where: {
          id: claim.refundId,
        },

        data: {
          status:
            RefundStatus.FAILED,

          providerRefundId:
            providerRefund
              .providerRefundId,

          metadata: {
            requestType:
              claim.requestType,

            providerStatus,
            providerIdempotencyKey,
          },
        },
      });

    return {
      refundId:
        failedRefund.id,

      paymentId:
        failedRefund.paymentId,

      status:
        failedRefund.status,

      providerRefundId:
        failedRefund
          .providerRefundId,

      amount:
        failedRefund.amount
          .toFixed(2),

      currency:
        failedRefund.currency,

      reason:
        failedRefund.reason,

      adminNote:
        failedRefund.adminNote,
    };
  }

  return synchronizeCompletedRefund(
    claim,
    providerRefund.providerRefundId,
    providerStatus,
    providerIdempotencyKey,
  );
}


export async function createAdminPaymentRefund(
  adminId: string,
  paymentId: string,
  input: CreatePaymentRefundInput,
) {
  /*
   * Fast idempotency path.
   *
   * Same idempotency key + same logical request resumes the
   * durable PaymentRefund.
   */
  const existingRefund =
    await prisma.paymentRefund.findUnique({
      where: {
        idempotencyKey:
          input.idempotencyKey,
      },

      include: {
        payment: true,
      },
    });

  if (existingRefund) {
    if (
      existingRefund.paymentId !==
      paymentId
    ) {
      throw new AppError(
        409,
        "REFUND_IDEMPOTENCY_CONFLICT",
        "Refund idempotency key is already associated with another payment",
      );
    }

    /*
     * Same key must represent exactly the same logical admin
     * refund request.
     */
    assertIdempotentRefundRequest(
      existingRefund,
      input,
    );

    if (
      !existingRefund.payment
        .providerPaymentId
    ) {
      throw new AppError(
        409,
        "PAYMENT_PROVIDER_ID_MISSING",
        "Payment does not have a provider transaction ID",
      );
    }

    return executeRefundClaim(
      toRefundClaim(
        existingRefund,
        existingRefund.payment.provider,
        existingRefund.payment
          .providerPaymentId,
      ),
    );
  }

  /*
   * Atomically reserve refundable balance.
   *
   * The transaction-scoped PostgreSQL advisory lock serializes
   * creation of refund claims for this Payment.
   */
  const claim =
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(
            hashtextextended(${paymentId}, 0)
          )
        `;

        /*
         * Re-check idempotency after obtaining the Payment lock.
         *
         * Another concurrent request may have created this
         * refund while this request was waiting.
         */
        const claimedExistingRefund =
          await tx.paymentRefund
            .findUnique({
              where: {
                idempotencyKey:
                  input.idempotencyKey,
              },

              include: {
                payment: true,
              },
            });

        if (
          claimedExistingRefund
        ) {
          if (
            claimedExistingRefund
              .paymentId !==
            paymentId
          ) {
            throw new AppError(
              409,
              "REFUND_IDEMPOTENCY_CONFLICT",
              "Refund idempotency key is already associated with another payment",
            );
          }

          assertIdempotentRefundRequest(
            claimedExistingRefund,
            input,
          );

          if (
            !claimedExistingRefund
              .payment
              .providerPaymentId
          ) {
            throw new AppError(
              409,
              "PAYMENT_PROVIDER_ID_MISSING",
              "Payment does not have a provider transaction ID",
            );
          }

          return toRefundClaim(
            claimedExistingRefund,
            claimedExistingRefund
              .payment.provider,
            claimedExistingRefund
              .payment
              .providerPaymentId,
          );
        }

        const payment =
          await tx.payment.findUnique({
            where: {
              id: paymentId,
            },

            include: {
              refunds: true,
            },
          });

        if (!payment) {
          throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "Payment not found",
          );
        }

        if (
          payment.status !==
            PaymentStatus.COMPLETED &&
          payment.status !==
            PaymentStatus.PARTIALLY_REFUNDED
        ) {
          throw new AppError(
            409,
            "PAYMENT_NOT_REFUNDABLE",
            `Payment cannot be refunded while its status is ${payment.status}`,
          );
        }

        if (
          !payment.providerPaymentId
        ) {
          throw new AppError(
            409,
            "PAYMENT_PROVIDER_ID_MISSING",
            "Payment does not have a provider transaction ID",
          );
        }

        const {
          paymentAmount,
          paymentCurrency,
        } =
          getPaymentProviderMetadata(
            payment.metadata,
          );

        const originalProviderAmount =
          parsePositiveMoney(
            paymentAmount,
            "PAYMENT_PROVIDER_AMOUNT_INVALID",
            "Stored provider payment amount is invalid",
          );

        /*
         * COMPLETED = confirmed refunded balance.
         * PENDING = reserved balance because provider outcome
         * may still be pending or uncertain.
         * FAILED does not reserve balance.
         */
        const reservedRefundTotal =
          payment.refunds
            .filter(
              (refund) =>
                refund.status ===
                  RefundStatus.COMPLETED ||
                refund.status ===
                  RefundStatus.PENDING,
            )
            .reduce(
              (total, refund) =>
                total.add(
                  refund.amount,
                ),
              new Decimal(0),
            );

        const remainingRefundableAmount =
          originalProviderAmount.sub(
            reservedRefundTotal,
          );

        if (
          remainingRefundableAmount
            .lte(0)
        ) {
          throw new AppError(
            409,
            "PAYMENT_NO_REFUNDABLE_BALANCE",
            "Payment has no remaining refundable balance",
          );
        }

        /*
         * Missing amount means refund the entire currently
         * available provider balance.
         */
        const requestedAmount =
          input.amount
            ? parsePositiveMoney(
                input.amount,
                "INVALID_REFUND_AMOUNT",
                "Refund amount must be greater than zero",
              )
            : remainingRefundableAmount;

        if (
          requestedAmount.gt(
            remainingRefundableAmount,
          )
        ) {
          throw new AppError(
            400,
            "REFUND_AMOUNT_EXCEEDS_REMAINING",
            "Refund amount exceeds the remaining refundable amount",
          );
        }

        const requestType:
          RefundRequestType =
            input.amount
              ? "PARTIAL"
              : "FULL";


        const refund =
          await tx.paymentRefund.create({
            data: {
              paymentId:
                payment.id,

              status:
                RefundStatus.PENDING,

              amount:
                requestedAmount,

              currency:
                paymentCurrency,

              reason:
                input.reason,

              adminNote:
                input.adminNote ??
                null,

              initiatedById:
                adminId,

              idempotencyKey:
                input.idempotencyKey,

              metadata: {
                requestType,
              },
            },
          });

        return toRefundClaim(
          refund,
          payment.provider,
          payment.providerPaymentId,
        );
      },
    );

  /*
  * Provider I/O intentionally happens after the reservation
  * transaction commits.
  *
  * Never hold the PostgreSQL transaction/advisory lock while
  * waiting for the external payment provider.
  */
  return executeRefundClaim(
    claim,
  );
}