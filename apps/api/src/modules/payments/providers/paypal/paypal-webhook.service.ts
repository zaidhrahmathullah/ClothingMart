import {
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from "../../../../generated/prisma/client.js";

import { Decimal } from "../../../../generated/prisma/internal/prismaNamespace.js";

import { AppError } from "../../../../lib/app-error.js";
import { prisma } from "../../../../lib/prisma.js";

import {
  finalizePaidOrder,
} from "../../../orders/order-finalization.service.js";

import {
  getNextPaymentStatus,
} from "../../payment.service.js";

import type {
  PayPalCaptureWebhookEventInput,
  PayPalRefundWebhookEventInput,
} from "./paypal-webhook.validation.js";




export async function resolvePayPalWebhookPayment(
  event: PayPalCaptureWebhookEventInput,
) {
  const providerOrderId =
    event.resource.supplementary_data
      .related_ids.order_id;

  const providerPaymentId =
    event.resource.id;


  const payment =
    await prisma.payment.findFirst({
      where: {
        provider: PaymentProvider.PAYPAL,
        providerOrderId,
      },

      include: {
        order: true,
      },
    });


  if (!payment) {
    throw new AppError(
      404,
      "PAYPAL_WEBHOOK_PAYMENT_NOT_FOUND",
      "No ClothingMart payment matches the PayPal webhook",
    );
  }


  if (
    !payment.providerOrderId ||
    payment.providerOrderId !== providerOrderId
  ) {
    throw new AppError(
      409,
      "PAYPAL_WEBHOOK_ORDER_MISMATCH",
      "PayPal webhook order does not match the stored payment",
    );
  }


  /**
   * A PROCESSING payment may not have a PayPal Capture
   * ID yet because the webhook can be the recovery path.
   *
   * If ClothingMart already stored one, however, it must
   * match the incoming webhook capture.
   */
  if (
    payment.providerPaymentId &&
    payment.providerPaymentId !== providerPaymentId
  ) {
    throw new AppError(
      409,
      "PAYPAL_WEBHOOK_CAPTURE_MISMATCH",
      "PayPal webhook capture does not match the stored payment",
    );
  }


  return {
    payment,
    order: payment.order,
    providerOrderId,
    providerPaymentId,
  };
}


/**
 * Synchronize a successful PayPal capture webhook with
 * ClothingMart's Payment and Order.
 *
 * This function does not capture money through PayPal.
 * The PAYMENT.CAPTURE.COMPLETED event means PayPal has
 * already completed the capture.
 */
export async function synchronizeCompletedPayPalWebhook(
  event: PayPalCaptureWebhookEventInput,
) {
  const {
    payment,
    providerOrderId,
    providerPaymentId,
  } =
    await resolvePayPalWebhookPayment(
      event,
    );


  const synchronizedPayment =
    await prisma.$transaction(
      async (tx) => {

        const existingWebhookEvent =
        await tx.paymentWebhookEvent.findUnique({
            where: {
            provider_providerEventId: {
                provider: PaymentProvider.PAYPAL,
                providerEventId: event.id,
            },
            },
        });


        if (existingWebhookEvent?.processedAt) {
        const existingPayment =
            await tx.payment.findUnique({
            where: {
                id: payment.id,
            },
            });

        if (!existingPayment) {
            throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "Payment not found while processing PayPal webhook replay",
            );
        }

        return existingPayment;
        }


        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },

            include: {
              order: true,
            },
          });


        if (!currentPayment) {
          throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "Payment not found while processing PayPal webhook",
          );
        }


        /**
         * Re-check the provider relationship using the
         * current database state.
         */
        if (
          currentPayment.provider !==
          PaymentProvider.PAYPAL
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_PROVIDER_MISMATCH",
            "Webhook payment provider does not match the stored payment",
          );
        }


        if (
          !currentPayment.providerOrderId ||
          currentPayment.providerOrderId !==
            providerOrderId
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_ORDER_MISMATCH",
            "PayPal webhook order does not match the stored payment",
          );
        }


        if (
          currentPayment.providerPaymentId &&
          currentPayment.providerPaymentId !==
            providerPaymentId
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_CAPTURE_MISMATCH",
            "PayPal webhook capture does not match the stored payment",
          );
        }


        /**
         * Reuse ClothingMart's payment state machine.
         *
         * PROCESSING → COMPLETED is valid.
         * COMPLETED  → COMPLETED is an idempotent no-op.
         *
         * Invalid states are rejected by the existing
         * state machine.
         */
        const nextPaymentStatus =
          getNextPaymentStatus(
            currentPayment.status,
            PaymentStatus.COMPLETED,
          );




        /**
         * Store the successful PayPal capture.
         *
         * For PayPal capture payments, the transaction
         * reference is the PayPal Capture ID.
         */
        const updatedPayment =
          await tx.payment.update({
            where: {
              id: currentPayment.id,
            },

            data: {
              status: nextPaymentStatus,

              providerOrderId,

              providerPaymentId,

              transactionReference:
                providerPaymentId,
            },
          });


        /**
         * Record successful processing only after the Payment
         * and Order synchronization has succeeded.
         *
         * Because this occurs in the same Prisma transaction,
         * all changes commit together or all changes roll back.
         */
        await tx.paymentWebhookEvent.upsert({
        where: {
            provider_providerEventId: {
            provider: PaymentProvider.PAYPAL,
            providerEventId: event.id,
            },
        },

        create: {
            provider: PaymentProvider.PAYPAL,
            providerEventId: event.id,
            eventType: event.event_type,
            paymentId: currentPayment.id,
            processedAt: new Date(),
        },

        update: {
            eventType: event.event_type,
            paymentId: currentPayment.id,
            processedAt: new Date(),
        },
        });

        return updatedPayment;
      },
    );

  await finalizePaidOrder(
    synchronizedPayment.orderId,
  );


  return {
    paymentId:
      synchronizedPayment.id,

    orderId:
      synchronizedPayment.orderId,

    provider:
      synchronizedPayment.provider,

    providerOrderId:
      synchronizedPayment.providerOrderId,

    providerPaymentId:
      synchronizedPayment.providerPaymentId,

    transactionReference:
      synchronizedPayment.transactionReference,

    status:
      synchronizedPayment.status,
  };
}


/**
 * Synchronize a non-success PayPal capture webhook.
 *
 * PAYMENT.CAPTURE.PENDING:
 *   Payment remains PROCESSING.
 *
 * PAYMENT.CAPTURE.DENIED:
 *   Payment moves to FAILED.
 *
 * Neither event changes the Order status.
 */
export async function synchronizeNonSuccessPayPalWebhook(
  event: PayPalCaptureWebhookEventInput,
) {
  if (
    event.event_type !==
      "PAYMENT.CAPTURE.PENDING" &&
    event.event_type !==
      "PAYMENT.CAPTURE.DENIED"
  ) {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_EVENT_UNSUPPORTED",
      `Unsupported PayPal non-success webhook event: ${event.event_type}`,
    );
  }


  const {
    payment,
    providerOrderId,
    providerPaymentId,
  } =
    await resolvePayPalWebhookPayment(
      event,
    );


  const synchronizedPayment =
    await prisma.$transaction(
      async (tx) => {
        /**
         * Re-read the Payment inside the transaction so
         * we operate on the latest local state.
         */

        /**
         * Ignore an exact PayPal event that ClothingMart has
         * already processed successfully.
         */
        const existingWebhookEvent =
        await tx.paymentWebhookEvent.findUnique({
            where: {
            provider_providerEventId: {
                provider: PaymentProvider.PAYPAL,
                providerEventId: event.id,
            },
            },
        });


        if (existingWebhookEvent?.processedAt) {
        const existingPayment =
            await tx.payment.findUnique({
            where: {
                id: payment.id,
            },
            });

        if (!existingPayment) {
            throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "Payment not found while processing PayPal webhook replay",
            );
        }

        return existingPayment;
        }


        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });


        if (!currentPayment) {
          throw new AppError(
            404,
            "PAYMENT_NOT_FOUND",
            "Payment not found while processing PayPal webhook",
          );
        }


        if (
          currentPayment.provider !==
          PaymentProvider.PAYPAL
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_PROVIDER_MISMATCH",
            "Webhook payment provider does not match the stored payment",
          );
        }


        if (
          !currentPayment.providerOrderId ||
          currentPayment.providerOrderId !==
            providerOrderId
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_ORDER_MISMATCH",
            "PayPal webhook order does not match the stored payment",
          );
        }


        if (
          currentPayment.providerPaymentId &&
          currentPayment.providerPaymentId !==
            providerPaymentId
        ) {
          throw new AppError(
            409,
            "PAYPAL_WEBHOOK_CAPTURE_MISMATCH",
            "PayPal webhook capture does not match the stored payment",
          );
        }


        /**
         * A completed payment must never be regressed by
         * a delayed PENDING or DENIED webhook.
         */
        if (
            currentPayment.status ===
            PaymentStatus.COMPLETED
        ) {
        await tx.paymentWebhookEvent.upsert({
            where: {
                provider_providerEventId: {
                    provider: PaymentProvider.PAYPAL,
                    providerEventId: event.id,
            },
            },

            create: {
                provider: PaymentProvider.PAYPAL,
                providerEventId: event.id,
                eventType: event.event_type,
                paymentId: currentPayment.id,
                processedAt: new Date(),
            },

            update: {
                eventType: event.event_type,
                paymentId: currentPayment.id,
                processedAt: new Date(),
            },
        });

        return currentPayment;
        }


        const targetStatus =
          event.event_type ===
          "PAYMENT.CAPTURE.DENIED"
            ? PaymentStatus.FAILED
            : PaymentStatus.PROCESSING;


        const nextPaymentStatus =
          getNextPaymentStatus(
            currentPayment.status,
            targetStatus,
          );


        const updatedPayment =
            await tx.payment.update({
                where: {
                id: currentPayment.id,
                },

                data: {
                status: nextPaymentStatus,

                providerOrderId,

                providerPaymentId,

                transactionReference:
                    providerPaymentId,
                },
            });


            await tx.paymentWebhookEvent.upsert({
                where: {
                    provider_providerEventId: {
                    provider: PaymentProvider.PAYPAL,
                    providerEventId: event.id,
                    },
                },

                create: {
                    provider: PaymentProvider.PAYPAL,
                    providerEventId: event.id,
                    eventType: event.event_type,
                    paymentId: currentPayment.id,
                    processedAt: new Date(),
                },

                update: {
                    eventType: event.event_type,
                    paymentId: currentPayment.id,
                    processedAt: new Date(),
                },
            });


            return updatedPayment;
      },
    );


  return {
    paymentId:
      synchronizedPayment.id,

    orderId:
      synchronizedPayment.orderId,

    provider:
      synchronizedPayment.provider,

    providerOrderId:
      synchronizedPayment.providerOrderId,

    providerPaymentId:
      synchronizedPayment.providerPaymentId,

    transactionReference:
      synchronizedPayment.transactionReference,

    status:
      synchronizedPayment.status,
  };
}



/**
 * Synchronize a PayPal PAYMENT.CAPTURE.REFUNDED webhook.
 *
 * PayPal is the provider truth here:
 * - resource.id is the PayPal Refund ID
 * - related_ids.capture_id is the original Capture ID
 *
 * The webhook may race with ClothingMart's admin refund
 * request, may be replayed, or may represent a refund that
 * was initiated externally in PayPal.
 */
export async function synchronizeRefundedPayPalWebhook(
  event: PayPalRefundWebhookEventInput,
) {
  const providerRefundId =
    event.resource.id;

  const providerPaymentId =
    event.resource.supplementary_data
      .related_ids.capture_id;

  let refundAmount: Decimal;

  try {
    refundAmount = new Decimal(
      event.resource.amount.value,
    );
  } catch {
    throw new AppError(
      400,
      "PAYPAL_REFUND_WEBHOOK_AMOUNT_INVALID",
      "PayPal refund webhook contains an invalid amount",
    );
  }

  if (refundAmount.lte(0)) {
    throw new AppError(
      400,
      "PAYPAL_REFUND_WEBHOOK_AMOUNT_INVALID",
      "PayPal refund webhook amount must be greater than zero",
    );
  }

  const refundCurrency =
    event.resource.amount.currency_code
      .toUpperCase();

  return prisma.$transaction(
    async (tx) => {
      /*
       * Locate the original ClothingMart Payment through
       * the PayPal Capture ID.
       */
      const payment =
        await tx.payment.findFirst({
          where: {
            provider:
              PaymentProvider.PAYPAL,

            providerPaymentId,
          },

          include: {
            refunds: true,
          },
        });

      if (!payment) {
        throw new AppError(
          404,
          "PAYPAL_REFUND_WEBHOOK_PAYMENT_NOT_FOUND",
          "No ClothingMart payment matches the refunded PayPal capture",
        );
      }

      // Use the same local Payment identity as the admin refund service.
      await tx.$executeRaw`
        SELECT pg_advisory_xact_lock(
          hashtextextended(${payment.id}, 0)
        )
      `;

      /*
       * Exact webhook replay protection.
       */
      const existingWebhookEvent =
        await tx.paymentWebhookEvent.findUnique({
          where: {
            provider_providerEventId: {
              provider:
                PaymentProvider.PAYPAL,
              providerEventId:
                event.id,
            },
          },
        });

      if (
        existingWebhookEvent?.processedAt
      ) {
        return {
          alreadyProcessed: true,
          paymentId:
            existingWebhookEvent.paymentId,
          providerRefundId,
        };
      }

      /*
       * First try the strongest identity:
       * PayPal Refund ID.
       *
       * This handles normal API → webhook synchronization.
       */
      let refund =
        await tx.paymentRefund.findFirst({
          where: {
            paymentId:
              payment.id,

            providerRefundId,
          },
        });

      /*
       * The webhook may arrive before ClothingMart has
       * persisted the provider refund ID.
       *
       * Match one compatible PENDING refund only when
       * amount + currency identify it unambiguously.
       */
      if (!refund) {
        const matchingPendingRefunds =
          await tx.paymentRefund.findMany({
            where: {
              paymentId:
                payment.id,

              status:
                RefundStatus.PENDING,

              providerRefundId: null,

              amount:
                refundAmount,

              currency:
                refundCurrency,
            },
          });

        if (
          matchingPendingRefunds.length === 1
        ) {
          refund =
            matchingPendingRefunds[0];
        } else if (
          matchingPendingRefunds.length > 1
        ) {
          throw new AppError(
            409,
            "PAYPAL_REFUND_WEBHOOK_AMBIGUOUS",
            "PayPal refund webhook matches multiple pending ClothingMart refunds",
          );
        }
      }

      /*
       * No local refund means the refund was most likely
       * initiated externally in PayPal.
       *
       * Preserve provider truth by creating an immutable
       * audit record. There is intentionally no fake admin
       * identity attached to an externally initiated refund,
       * so the current schema cannot safely manufacture one.
       *
       * For now, fail explicitly rather than corrupting
       * audit ownership. Step 6D will resolve this schema
       * requirement before external refunds are accepted.
       */
      if (!refund) {
        /*
        * No matching local refund means PayPal is reporting a
        * provider-side refund that was not initiated through
        * ClothingMart.
        *
        * Preserve provider truth without manufacturing an admin
        * identity.
        */
        refund =
          await tx.paymentRefund.create({
            data: {
              paymentId:
                payment.id,

              status:
                RefundStatus.COMPLETED,

              amount:
                refundAmount,

              currency:
                refundCurrency,

              providerRefundId,

              reason:
                "EXTERNAL_PROVIDER_REFUND",

              adminNote:
                null,

              /*
              * Provider-originated refunds have no authenticated
              * ClothingMart administrator.
              */
              initiatedById:
                null,

              /*
              * PayPal webhook event IDs are globally unique for
              * this provider and give this external refund a
              * stable local idempotency identity.
              */
              idempotencyKey:
                `paypal-webhook-refund-${event.id}`,

              completedAt:
                new Date(),

              metadata: {
                source:
                  "PAYPAL_WEBHOOK",

                webhookEventId:
                  event.id,

                providerStatus:
                  event.resource.status ??
                  "COMPLETED",
              },
            },
          });
      }

      if (
        refund.paymentId !==
        payment.id
      ) {
        throw new AppError(
          409,
          "PAYPAL_REFUND_WEBHOOK_PAYMENT_MISMATCH",
          "PayPal refund does not belong to the resolved ClothingMart payment",
        );
      }

      if (
        refund.providerRefundId &&
        refund.providerRefundId !==
          providerRefundId
      ) {
        throw new AppError(
          409,
          "PAYPAL_REFUND_WEBHOOK_ID_MISMATCH",
          "PayPal refund ID does not match the stored refund",
        );
      }

      if (
        !new Decimal(
          refund.amount,
        ).eq(refundAmount)
      ) {
        throw new AppError(
          409,
          "PAYPAL_REFUND_WEBHOOK_AMOUNT_MISMATCH",
          "PayPal refund amount does not match the stored refund",
        );
      }

      if (
        refund.currency.toUpperCase() !==
        refundCurrency
      ) {
        throw new AppError(
          409,
          "PAYPAL_REFUND_WEBHOOK_CURRENCY_MISMATCH",
          "PayPal refund currency does not match the stored refund",
        );
      }

      /*
       * Provider truth confirms this individual refund.
       */
      if (
        refund.status !==
        RefundStatus.COMPLETED
      ) {
        refund =
          await tx.paymentRefund.update({
            where: {
              id: refund.id,
            },

            data: {
              status:
                RefundStatus.COMPLETED,

              providerRefundId,

              completedAt:
                refund.completedAt ??
                new Date(),

              metadata: {
                ...(refund.metadata &&
                typeof refund.metadata === "object" &&
                !Array.isArray(refund.metadata)
                  ? refund.metadata
                  : {}),
                webhookEventId: event.id,
                providerStatus:
                  event.resource.status ?? "COMPLETED",
              },
            },
          });
      }

      /*
       * Recalculate aggregate Payment refund state from
       * durable COMPLETED refund records.
       */
      const completedRefunds =
        await tx.paymentRefund.findMany({
          where: {
            paymentId:
              payment.id,

            status:
              RefundStatus.COMPLETED,
          },

          select: {
            amount: true,
          },
        });

      const totalRefunded =
        completedRefunds.reduce(
          (total, item) =>
            total.add(item.amount),
          new Decimal(0),
        );

      const metadata =
        payment.metadata;

      if (
        !metadata ||
        typeof metadata !== "object" ||
        Array.isArray(metadata)
      ) {
        throw new AppError(
          409,
          "PAYMENT_METADATA_INVALID",
          "Payment provider metadata is unavailable",
        );
      }

      const paymentAmountValue =
        (
          metadata as Record<
            string,
            unknown
          >
        ).paymentAmount;

      if (
        typeof paymentAmountValue !==
        "string"
      ) {
        throw new AppError(
          409,
          "PAYMENT_METADATA_INVALID",
          "Payment provider amount is unavailable",
        );
      }

      let originalAmount: Decimal;

      try {
        originalAmount =
          new Decimal(
            paymentAmountValue,
          );
      } catch {
        throw new AppError(
          409,
          "PAYMENT_METADATA_INVALID",
          "Payment provider amount is invalid",
        );
      }

      if (
        totalRefunded.gt(
          originalAmount,
        )
      ) {
        throw new AppError(
          409,
          "PAYMENT_REFUND_TOTAL_INVALID",
          "Completed refunds exceed the original payment amount",
        );
      }

      const targetPaymentStatus =
        totalRefunded.eq(
          originalAmount,
        )
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED;

      let paymentStatus =
        payment.status;

      if (
        paymentStatus !==
        targetPaymentStatus
      ) {
        paymentStatus =
          getNextPaymentStatus(
            paymentStatus,
            targetPaymentStatus,
          );

        await tx.payment.update({
          where: {
            id: payment.id,
          },

          data: {
            status:
              paymentStatus,
          },
        });
      }

      /*
       * Mark this PayPal event processed only after all
       * refund/payment synchronization succeeds.
       */
      await tx.paymentWebhookEvent.upsert({
        where: {
          provider_providerEventId: {
            provider:
              PaymentProvider.PAYPAL,

            providerEventId:
              event.id,
          },
        },

        create: {
          provider:
            PaymentProvider.PAYPAL,

          providerEventId:
            event.id,

          eventType:
            event.event_type,

          paymentId:
            payment.id,

          processedAt:
            new Date(),
        },

        update: {
          eventType:
            event.event_type,

          paymentId:
            payment.id,

          processedAt:
            new Date(),
        },
      });

      return {
        alreadyProcessed: false,
        paymentId:
          payment.id,
        refundId:
          refund.id,
        providerRefundId,
        refundStatus:
          refund.status,
        paymentStatus,
        totalRefunded:
          totalRefunded.toFixed(2),
      };
    },
  );
}