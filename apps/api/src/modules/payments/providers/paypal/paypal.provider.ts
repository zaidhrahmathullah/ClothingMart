import { AppError } from "../../../../lib/app-error.js";

import type { PaymentProvider } from "../../payment.provider.js";
import {
  PAYMENT_PROVIDERS,
  type CapturePaymentResult,
  type CreatePaymentInput,
  type CreatePaymentResult,
  type VerifyPaymentResult,
  type RefundPaymentInput,
  type RefundPaymentResult,
} from "../../payment.types.js";
import { paypalClient } from "./paypal.client.js";


export class PayPalProvider
  implements PaymentProvider
{
  readonly name = PAYMENT_PROVIDERS.PAYPAL;

  async createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult> {
    const response =
      await paypalClient.createOrder(
        {
          intent: "CAPTURE",

          purchase_units: [
            {
              reference_id: input.orderId,

              amount: {
                currency_code: input.currency,
                value: input.amount,
              },

              custom_id: input.orderId,
            },
          ],
        },

        input.idempotencyKey,
      );

    if (!response.id) {
      throw new AppError(
        502,
        "PAYPAL_INVALID_ORDER_RESPONSE",
        "PayPal did not return an order ID",
      );
    }

    const approvalLink =
      response.links?.find(
        (link) =>
          link.rel === "approve" ||
          link.rel === "payer-action",
      );

    return {
      providerOrderId: response.id,
      approvalUrl: approvalLink?.href,
    };
  }

  async capturePayment(
    providerPaymentId: string,
    idempotencyKey: string,
  ): Promise<CapturePaymentResult> {
    const response =
      await paypalClient.captureOrder(
        providerPaymentId,
        idempotencyKey,
      );

    if (!response.id) {
      throw new AppError(
        502,
        "PAYPAL_INVALID_CAPTURE_RESPONSE",
        "PayPal did not return an order ID after capture",
      );
    }

    const capture =
      response.purchase_units
        ?.flatMap(
          (unit) =>
            unit.payments?.captures ?? [],
        )[0];

    if (!capture?.id) {
      throw new AppError(
        502,
        "PAYPAL_CAPTURE_ID_MISSING",
        "PayPal did not return a capture ID",
      );
    }

    return {
      providerPaymentId: capture.id,
      providerOrderId: response.id,
      status:
        capture.status ??
        response.status,
      transactionReference:
        capture.id,
      amount:
        capture.amount?.value,
      currency:
        capture.amount?.currency_code,
    };
  }

  async verifyPayment(
    providerPaymentId: string,
  ): Promise<VerifyPaymentResult> {
    const order =
      await paypalClient.getOrder(
        providerPaymentId,
      );

    if (!order.id) {
      throw new AppError(
        502,
        "PAYPAL_INVALID_ORDER_RESPONSE",
        "PayPal did not return an order ID",
      );
    }

    const purchaseUnit =
      order.purchase_units?.[0];

    /*
    * A PayPal order that has already been captured may
    * expose the completed capture through the GET Order
    * response.
    *
    * This is important for recovery after an uncertain
    * capture result:
    *
    * ClothingMart = PROCESSING
    * PayPal       = COMPLETED
    *
    * In that situation we recover the existing capture
    * instead of attempting another financial capture.
    */
    const completedCapture =
      order.purchase_units
        ?.flatMap(
          (unit) =>
            unit.payments?.captures ?? [],
        )
        .find(
          (capture) =>
            capture.status === "COMPLETED",
        );

    if (
      order.status === "COMPLETED" &&
      !completedCapture?.id
    ) {
      throw new AppError(
        502,
        "PAYPAL_COMPLETED_CAPTURE_MISSING",
        "PayPal order is completed but no completed capture was returned",
      );
    }

    return {
      /*
      * For a completed PayPal order this becomes the
      * authoritative PayPal Capture ID.
      *
      * Before capture, there is no capture ID yet, so the
      * PayPal Order ID remains the provider identifier.
      */
      providerPaymentId:
        completedCapture?.id ?? order.id,

      providerOrderId: order.id,

      status: order.status,

      /*
      * Prefer capture-level financial details after
      * capture. Before capture, use the order amount.
      */
      amount:
        completedCapture?.amount?.value ??
        purchaseUnit?.amount?.value,

      currency:
        completedCapture?.amount?.currency_code ??
        purchaseUnit?.amount?.currency_code,
    };
  }

  async cancelPayment(
    _providerPaymentId: string,
  ): Promise<void> {
    throw new AppError(
      501,
      "PAYMENT_PROVIDER_NOT_IMPLEMENTED",
      "PayPal payment cancellation is not implemented yet",
    );
  }

  async refundPayment(
    input: RefundPaymentInput,
  ): Promise<RefundPaymentResult> {
    if (input.amount && !input.currency) {
      throw new AppError(
        400,
        "PAYMENT_REFUND_CURRENCY_REQUIRED",
        "Refund currency is required when a refund amount is provided",
      );
    }

    const response =
      await paypalClient.refundCapture(
        input.providerPaymentId,
        input.amount
          ? {
              amount: {
                value: input.amount,
                currency_code: input.currency!,
              },
            }
          : {},
        input.idempotencyKey,
      );

    if (!response.id) {
      throw new AppError(
        502,
        "PAYPAL_INVALID_REFUND_RESPONSE",
        "PayPal did not return a refund ID",
      );
    }

    return {
      providerRefundId: response.id,
      status: response.status,
      amount: response.amount?.value,
      currency: response.amount?.currency_code,
    };
  }
}