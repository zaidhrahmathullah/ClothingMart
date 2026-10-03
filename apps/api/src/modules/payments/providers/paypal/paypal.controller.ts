import type {
  Request,
  Response,
} from "express";

import { AppError } from "../../../../lib/app-error.js";

import { getPayPalConfig } from "../../providers/paypal/paypal.config.js";


import {
  normalizePayPalRefundWebhook,
} from "../../providers/paypal/paypal-webhook.normalize.js";


import {
  capturePayPalPayment,
  createPayPalPayment,
  cancelPayPalPayment,
} from "../../providers/paypal/paypal-payment.service.js";

import { paypalClient } from "../../providers/paypal/paypal.client.js";

import type {
  PayPalWebhookEvent,
  PayPalWebhookVerificationHeaders,
} from "../../providers/paypal/paypal.types.js";

import {
  paypalCaptureWebhookEventSchema,
  paypalRefundWebhookEventSchema,
  paypalWebhookEventSchema,
} from "../../providers/paypal/paypal-webhook.validation.js";

import type {
  CapturePaymentInput,
  CreatePaymentInput,
  CancelPaymentInput,
} from "../../payment.validation.js";

import {
  synchronizeCompletedPayPalWebhook,
  synchronizeNonSuccessPayPalWebhook,
  synchronizeRefundedPayPalWebhook,
} from "../../providers/paypal/paypal-webhook.service.js";



/**
 * Public configuration required to initialize
 * the PayPal JavaScript SDK.
 *
 * Only expose non-secret values.
 *
 * getPayPalConfig() validates the selected environment
 * and ensures Live payments are explicitly enabled.
 */
export function getPublicPayPalConfigController(
  _req: Request,
  res: Response,
) {
  const config = getPayPalConfig();

  res.status(200).json({
    success: true,
    data: {
      provider: "PAYPAL",
      environment: config.environment,
      clientId: config.clientId,
      currency: "USD",
      intent: "capture",
    },
  });
}

export async function createPaymentController(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.sub;

  const { orderId } =
    req.body as CreatePaymentInput;

  const payment =
    await createPayPalPayment(
      userId,
      orderId,
    );

  res.status(201).json({
    success: true,
    data: payment,
  });
}


export async function capturePaymentController(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.sub;

  const {
    orderId,
    providerOrderId,
  } = req.body as CapturePaymentInput;

  const payment =
    await capturePayPalPayment(
      userId,
      orderId,
      providerOrderId,
    );

  res.status(200).json({
    success: true,
    data: payment,
  });
}



export async function cancelPaymentController(
  req: Request,
  res: Response,
) {
  const userId = (req as any).user.sub;

  const {
    orderId,
    providerOrderId,
  } = req.body as CancelPaymentInput;

  const payment =
    await cancelPayPalPayment(
      userId,
      orderId,
      providerOrderId,
    );

  res.status(200).json({
    success: true,
    data: payment,
  });
}


/**
 * Receives PayPal webhook notifications.
 *
 * This endpoint does not use ClothingMart JWT
 * authentication because the caller is PayPal.
 *
 * Authenticity is established using PayPal's webhook
 * signature verification API.
 */
export async function paypalWebhookController(
  req: Request,
  res: Response,
) {

  const rawBody = (
    req as Request & {
      rawBody?: Buffer;
    }
  ).rawBody;

  if (!rawBody) {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_RAW_BODY_MISSING",
      "Raw PayPal webhook body is unavailable",
    );
  }


  const authAlgo =
    req.get("paypal-auth-algo");

  const certUrl =
    req.get("paypal-cert-url");

  const transmissionId =
    req.get("paypal-transmission-id");

  const transmissionSig =
    req.get("paypal-transmission-sig");

  const transmissionTime =
    req.get("paypal-transmission-time");


  if (
    !authAlgo ||
    !certUrl ||
    !transmissionId ||
    !transmissionSig ||
    !transmissionTime
  ) {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_HEADERS_MISSING",
      "Required PayPal webhook verification headers are missing",
    );
  }


  /**
   * First validate the common webhook envelope.
   *
   * We need a structurally valid event before sending it
   * to PayPal for signature verification.
   */
  const webhookResult =
    paypalWebhookEventSchema.safeParse(
      req.body,
    );


  if (!webhookResult.success) {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_INVALID",
      "Invalid PayPal webhook payload",
    );
  }


  const event = webhookResult.data;

  let verificationEvent: PayPalWebhookEvent;

  try {
    verificationEvent = JSON.parse(
      rawBody.toString("utf8"),
    ) as PayPalWebhookEvent;
  } catch {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_INVALID_JSON",
      "Invalid PayPal webhook JSON payload",
    );
  }


  const headers: PayPalWebhookVerificationHeaders = {
    authAlgo,
    certUrl,
    transmissionId,
    transmissionSig,
    transmissionTime,
  };


  /**
   * Never process the webhook until PayPal confirms
   * that the notification is authentic.
   */
  const isValid =
    await paypalClient.verifyWebhookSignature(
      headers,
      verificationEvent,
    );


  if (!isValid) {
    throw new AppError(
      400,
      "PAYPAL_WEBHOOK_SIGNATURE_INVALID",
      "PayPal webhook signature verification failed",
    );
  }


  /*
  * Refund resources differ from capture resources:
  *
  * resource.id = PayPal Refund ID
  * related_ids.capture_id = original Capture ID
  */
  if (
    event.event_type ===
    "PAYMENT.CAPTURE.REFUNDED"
  ) {
    const normalizedEvent =
      normalizePayPalRefundWebhook(event);

    const refundEventResult =
      paypalRefundWebhookEventSchema.safeParse(
        normalizedEvent,
      );

    if (!refundEventResult.success) {
      throw new AppError(
        400,
        "PAYPAL_REFUND_WEBHOOK_INVALID",
        "Invalid PayPal refund webhook payload",
      );
    }

    await synchronizeRefundedPayPalWebhook(
      refundEventResult.data,
    );

    res.status(200).json({
      success: true,
    });

    return;
  }
  /**
   * The webhook is authentic.
   *
   * ClothingMart currently processes only capture
   * lifecycle events. Other authentic PayPal events are
   * acknowledged without changing application state.
   */
  const captureEventResult =
    paypalCaptureWebhookEventSchema.safeParse(
      event,
    );


  if (!captureEventResult.success) {
    res.status(200).json({
      success: true,
    });

    return;
  }


  const captureEvent =
    captureEventResult.data;


  switch (captureEvent.event_type) {
    case "PAYMENT.CAPTURE.COMPLETED": {
      await synchronizeCompletedPayPalWebhook(
        captureEvent,
      );

      break;
    }


    case "PAYMENT.CAPTURE.PENDING":
    case "PAYMENT.CAPTURE.DENIED": {
      await synchronizeNonSuccessPayPalWebhook(
        captureEvent,
      );

      break;
    }
  }


  res.status(200).json({
    success: true,
  });

}