import { AppError } from "../../../../lib/app-error.js";
import { prisma } from "../../../../lib/prisma.js";

import {
  PaymentStatus,
} from "../../../../generated/prisma/client.js";

import {
  exchangeRateService,
} from "../../exchange-rate/exchange-rate.service.js";

import {
  finalizePaidOrder,
} from "../../../orders/order-finalization.service.js";

import {
  getPaymentProvider,
  getNextPaymentStatus,
} from "../../payment.service.js";


export async function createPayPalPayment(
  userId: string,
  orderId: string,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new AppError(
      404,
      "ORDER_NOT_FOUND",
      "Order not found",
    );
  }

  const pendingPayment = order.payment.find(
    (item) => item.status === PaymentStatus.PENDING,
  );

  const processingPayment = order.payment.find(
    (item) =>
      item.provider === "PAYPAL" &&
      item.status === PaymentStatus.PROCESSING,
  );

  const completedPayment = order.payment.find(
    (item) =>
      item.provider === "PAYPAL" &&
      item.status === PaymentStatus.COMPLETED,
  );

  if (completedPayment) {
    throw new AppError(
      409,
      "PAYMENT_ALREADY_COMPLETED",
      "This order already has a completed PayPal payment",
    );
  }

  if (processingPayment) {
    if (!processingPayment.providerOrderId) {
      throw new AppError(
        409,
        "PAYMENT_CREATION_IN_PROGRESS",
        "PayPal payment creation is already in progress",
      );
    }

    const metadata =
      processingPayment.metadata &&
      typeof processingPayment.metadata === "object" &&
      !Array.isArray(processingPayment.metadata)
        ? processingPayment.metadata
        : null;

    const paymentAmount =
      metadata &&
      "paymentAmount" in metadata &&
      typeof metadata.paymentAmount === "string"
        ? metadata.paymentAmount
        : null;

    const paymentCurrency =
      metadata &&
      "paymentCurrency" in metadata &&
      typeof metadata.paymentCurrency === "string"
        ? metadata.paymentCurrency
        : null;

    if (!paymentAmount || !paymentCurrency) {
      throw new AppError(
        500,
        "PAYMENT_METADATA_INVALID",
        "Existing PayPal payment metadata is missing or invalid",
      );
    }

    return {
      paymentId: processingPayment.id,
      orderId: order.id,
      provider: "PAYPAL" as const,
      providerOrderId:
        processingPayment.providerOrderId,
      approvalUrl: null,
      amount: paymentAmount,
      currency: paymentCurrency,
    };
  }

  if (!pendingPayment) {
    throw new AppError(
      400,
      "PAYMENT_NOT_AVAILABLE",
      "No pending payment is available for this order",
    );
  }

  const payment = pendingPayment;

  if (payment.currency !== "LKR") {
    throw new AppError(
      400,
      "INVALID_PAYMENT_CURRENCY",
      "This payment is not configured for LKR",
    );
  }

  const lkrAmount = payment.amount.toFixed(2);

  if (Number(lkrAmount) <= 0) {
    throw new AppError(
      400,
      "INVALID_PAYMENT_AMOUNT",
      "Payment amount must be greater than zero",
    );
  }

  const exchangeRate = await exchangeRateService.convert(
    lkrAmount,
    "LKR",
    "USD",
  );

  const usdAmount = Number(exchangeRate.convertedAmount).toFixed(2);

  if (Number(usdAmount) <= 0) {
    throw new AppError(
      400,
      "INVALID_CONVERTED_AMOUNT",
      "Converted payment amount must be greater than zero",
    );
  }

  const provider = getPaymentProvider("PAYPAL");

  const paypalPayment = await provider.createPayment({
    orderId: order.id,
    amount: usdAmount,
    currency: "USD",

    /*
    * Stable identity for this logical PayPal create-order
    * operation. Retrying creation for the same local Payment
    * must reuse the same provider idempotency key.
    */
    idempotencyKey: `payment-create-${payment.id}`,
  });

  const paymentUpdate =
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: PaymentStatus.PENDING,
      },

      data: {
        provider: "PAYPAL",
        providerOrderId:
          paypalPayment.providerOrderId,
        status: PaymentStatus.PROCESSING,
        metadata: {
          baseCurrency: "LKR",
          baseAmount: lkrAmount,
          paymentCurrency: "USD",
          paymentAmount: usdAmount,
          exchangeRate: exchangeRate.rate,
        },
      },
    });

  let updatedPayment;

  if (paymentUpdate.count === 1) {
    updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });
  } else {
    /*
    * Another concurrent create request may already have
    * moved this exact Payment to PROCESSING.
    *
    * Both provider calls use the same PayPal-Request-Id,
    * so a legitimate concurrent retry must converge on
    * the same PayPal Order ID.
    */
    const currentPayment =
      await prisma.payment.findUnique({
        where: {
          id: payment.id,
        },
      });

    if (
      currentPayment?.status ===
        PaymentStatus.PROCESSING &&
      currentPayment.provider === "PAYPAL" &&
      currentPayment.providerOrderId ===
        paypalPayment.providerOrderId
    ) {
      updatedPayment = currentPayment;
    } else {
      throw new AppError(
        409,
        "PAYMENT_STATE_CHANGED",
        "Payment status changed while PayPal payment creation was being synchronized",
      );
    }
  }

  return {
    paymentId: updatedPayment.id,
    orderId: order.id,
    provider: "PAYPAL",
    providerOrderId: paypalPayment.providerOrderId,
    approvalUrl: paypalPayment.approvalUrl,
    amount: usdAmount,
    currency: "USD",
  };
}

export async function getPayPalPaymentForCapture(
  userId: string,
  orderId: string,
  providerOrderId: string,
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      payment: true,
    },
  });

  if (!order) {
    throw new AppError(
      404,
      "ORDER_NOT_FOUND",
      "Order not found",
    );
  }

  const payment = order.payment.find(
    (item) =>
      item.provider === "PAYPAL" &&
      item.providerOrderId === providerOrderId,
  );

  if (!payment) {
    throw new AppError(
      404,
      "PAYMENT_NOT_FOUND",
      "PayPal payment was not found for this order",
    );
  }

  if (payment.status !== PaymentStatus.PROCESSING) {
    throw new AppError(
      400,
      "PAYMENT_NOT_CAPTURABLE",
      `Payment cannot be captured while its status is ${payment.status}`,
    );
  }

  if (!payment.providerOrderId) {
    throw new AppError(
      400,
      "PAYPAL_ORDER_ID_MISSING",
      "PayPal Order ID is missing from the payment",
    );
  }

  return {
    order,
    payment,
  };
}

export async function capturePayPalPayment(
  userId: string,
  orderId: string,
  providerOrderId: string,
) {
  const { order, payment } =
    await getPayPalPaymentForCapture(
      userId,
      orderId,
      providerOrderId,
    );

  const provider = getPaymentProvider("PAYPAL");

  /*
   * Verify the PayPal order before capture.
   */
  const verification =
    await provider.verifyPayment(
      providerOrderId,
    );

  if (
    verification.providerOrderId !==
    providerOrderId
  ) {
    throw new AppError(
      400,
      "PAYPAL_ORDER_MISMATCH",
      "PayPal Order ID does not match the stored payment",
    );
  }


  /*
   * Phase 7 stored the exact USD amount and currency
   * sent to PayPal inside Payment.metadata.
   */
  const metadata =
    payment.metadata &&
    typeof payment.metadata === "object" &&
    !Array.isArray(payment.metadata)
      ? payment.metadata
      : null;

  const expectedAmount =
    metadata &&
    "paymentAmount" in metadata &&
    typeof metadata.paymentAmount === "string"
      ? metadata.paymentAmount
      : null;

  const expectedCurrency =
    metadata &&
    "paymentCurrency" in metadata &&
    typeof metadata.paymentCurrency === "string"
      ? metadata.paymentCurrency
      : null;

  if (!expectedAmount || !expectedCurrency) {
    throw new AppError(
      500,
      "PAYMENT_METADATA_INVALID",
      "Payment conversion metadata is missing or invalid",
    );
  }

  if (
    verification.amount !== expectedAmount
  ) {
    throw new AppError(
      400,
      "PAYPAL_AMOUNT_MISMATCH",
      "PayPal payment amount does not match the expected amount",
    );
  }

  if (
    verification.currency !== expectedCurrency
  ) {
    throw new AppError(
      400,
      "PAYPAL_CURRENCY_MISMATCH",
      "PayPal payment currency does not match the expected currency",
    );
  }



  const capture =
    verification.status === "COMPLETED"
      ? {
          providerPaymentId:
            verification.providerPaymentId,
          providerOrderId:
            verification.providerOrderId,
          status: verification.status,
          transactionReference:
            verification.providerPaymentId,
          amount: verification.amount,
          currency: verification.currency,
        }
      : verification.status === "APPROVED"
        ? await provider.capturePayment(
            providerOrderId,
            `payment-capture-${payment.id}`,
          )
        : (() => {
            throw new AppError(
              400,
              "PAYPAL_ORDER_NOT_APPROVED",
              `PayPal order cannot be captured while its status is ${verification.status}`,
            );
          })();

  if (
    capture.providerOrderId !==
    providerOrderId
  ) {
    throw new AppError(
      502,
      "PAYPAL_CAPTURE_ORDER_MISMATCH",
      "Captured PayPal Order ID does not match the expected order",
    );
  }

  if (capture.status !== "COMPLETED") {
    throw new AppError(
      502,
      "PAYPAL_CAPTURE_NOT_COMPLETED",
      `PayPal capture returned status ${capture.status}`,
    );
  }

  if (capture.amount !== expectedAmount) {
    throw new AppError(
      502,
      "PAYPAL_CAPTURE_AMOUNT_MISMATCH",
      "Captured PayPal amount does not match the expected amount",
    );
  }

  if (
    capture.currency !== expectedCurrency
  ) {
    throw new AppError(
      502,
      "PAYPAL_CAPTURE_CURRENCY_MISMATCH",
      "Captured PayPal currency does not match the expected currency",
    );
  }

  if (!capture.providerPaymentId) {
    throw new AppError(
      502,
      "PAYPAL_CAPTURE_ID_MISSING",
      "PayPal did not return a capture ID",
    );
  }

  const nextStatus =
    getNextPaymentStatus(
      payment.status,
      PaymentStatus.COMPLETED,
    );

  const updatedPayment =
    await prisma.$transaction(async (tx) => {
      /*
      * Persist the financial truth first.
      *
      * PayPal has already completed the capture at this
      * point, so Payment must become COMPLETED independently
      * of inventory/cart finalization.
      */
      const paymentUpdate =
        await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: payment.status,
          },

          data: {
            status: nextStatus,

            // PayPal Capture ID
            providerPaymentId:
              capture.providerPaymentId,

            // PayPal Order ID
            providerOrderId:
              capture.providerOrderId,

            transactionReference:
              capture.transactionReference,
          },
        });

      if (paymentUpdate.count !== 1) {
        /*
        * Another capture request or webhook may already have
        * completed this exact Payment.
        */
        const currentPayment =
          await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
          });

        if (
          currentPayment?.status ===
            PaymentStatus.COMPLETED &&
          currentPayment.providerOrderId ===
            capture.providerOrderId &&
          currentPayment.providerPaymentId ===
            capture.providerPaymentId
        ) {
          return currentPayment;
        }

        throw new AppError(
          409,
          "PAYMENT_STATE_CHANGED",
          "Payment status changed while capture was being synchronized",
        );
      }

      return tx.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });
    });

  /*
  * Payment completion is now durable.
  *
  * Inventory/cart finalization happens separately so a
  * business-level stock problem can never roll back the
  * financial fact that PayPal captured the money.
  */
  await finalizePaidOrder(order.id);

  return {
    paymentId: updatedPayment.id,
    orderId: order.id,
    provider: "PAYPAL" as const,
    providerOrderId:
      updatedPayment.providerOrderId,
    providerPaymentId:
      updatedPayment.providerPaymentId,
    transactionReference:
      updatedPayment.transactionReference,
    status: updatedPayment.status,
    amount: expectedAmount,
    currency: expectedCurrency,
  };
}


/**
 * Cancel a PayPal payment attempt after the customer
 * explicitly cancels the PayPal checkout flow.
 *
 * This changes ClothingMart's local payment lifecycle.
 * It does not cancel the Order itself.
 */
/**
 * Cancel a PayPal payment attempt after the customer
 * explicitly cancels the PayPal checkout flow.
 *
 * The Payment is re-read inside the transaction so a
 * concurrent webhook/capture cannot be overwritten by
 * a stale cancellation request.
 *
 * This changes ClothingMart's local payment lifecycle.
 * It does not cancel the Order itself.
 */
export async function cancelPayPalPayment(
  userId: string,
  orderId: string,
  providerOrderId: string,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: {
        payment: true,
      },
    });

    if (!order) {
      throw new AppError(
        404,
        "ORDER_NOT_FOUND",
        "Order not found",
      );
    }

    /*
     * Cancellation must target the exact PayPal payment
     * attempt associated with the supplied PayPal Order ID.
     */
    const payment = order.payment.find(
      (item) =>
        item.provider === "PAYPAL" &&
        item.providerOrderId === providerOrderId,
    );

    if (!payment) {
      throw new AppError(
        404,
        "PAYMENT_NOT_FOUND",
        "PayPal payment was not found for this order",
      );
    }

    /*
     * A completed payment is final and cannot be cancelled.
     */
    if (
      payment.status ===
      PaymentStatus.COMPLETED
    ) {
      throw new AppError(
        409,
        "PAYMENT_ALREADY_COMPLETED",
        "A completed payment cannot be cancelled",
      );
    }

    /*
     * Repeated cancellation is idempotent.
     */
    if (
      payment.status ===
      PaymentStatus.CANCELLED
    ) {
      return {
        paymentId: payment.id,
        orderId: order.id,
        provider: "PAYPAL" as const,
        providerOrderId:
          payment.providerOrderId,
        status: payment.status,
      };
    }

    /*
     * FAILED is terminal and must not be rewritten.
     */
    if (
      payment.status === PaymentStatus.FAILED
    ) {
      throw new AppError(
        409,
        "PAYMENT_ALREADY_FAILED",
        "A failed payment cannot be cancelled",
      );
    }

    const nextStatus =
      getNextPaymentStatus(
        payment.status,
        PaymentStatus.CANCELLED,
      );

    /*
     * Conditional update prevents a concurrent payment
     * state change from being overwritten.
     *
     * Example:
     * PROCESSING read above
     * → webhook changes it to COMPLETED
     * → this update no longer matches PROCESSING
     */
    const result =
      await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: payment.status,
        },

        data: {
          status: nextStatus,
        },
      });

    if (result.count !== 1) {
      throw new AppError(
        409,
        "PAYMENT_STATE_CHANGED",
        "Payment status changed while cancellation was being processed",
      );
    }

    return {
      paymentId: payment.id,
      orderId: order.id,
      provider: "PAYPAL" as const,
      providerOrderId:
        payment.providerOrderId,
      status: nextStatus,
    };
  });
}