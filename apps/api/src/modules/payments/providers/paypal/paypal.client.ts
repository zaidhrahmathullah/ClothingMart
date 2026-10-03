import { AppError } from "../../../../lib/app-error.js";
import { getPayPalConfig } from "./paypal.config.js";

import type {
  PayPalCreateOrderRequest,
  PayPalCreateOrderResponse,
  PayPalOrderDetails,
  PayPalCaptureResponse,
  PayPalWebhookEvent,
  PayPalWebhookVerificationHeaders,
  PayPalVerifyWebhookSignatureRequest,
  PayPalVerifyWebhookSignatureResponse,
  PayPalRefundRequest,
  PayPalRefundResponse,
} from "./paypal.types.js";


type PayPalTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};


type PayPalErrorResponse = {
  name?: string;
  message?: string;
  debug_id?: string;
  details?: Array<{
    issue?: string;
    description?: string;
  }>;
};


export class PayPalClient {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;


  async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (
      this.accessToken &&
      now < this.accessTokenExpiresAt
    ) {
      return this.accessToken;
    }

    const config = getPayPalConfig();

    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString("base64");

    const response = await fetch(
      `${config.baseUrl}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
    );

    const responseText = await response.text();

    let result:
      | PayPalTokenResponse
      | PayPalErrorResponse;

    try {
      result = JSON.parse(responseText) as
        | PayPalTokenResponse
        | PayPalErrorResponse;
    } catch {
      throw new AppError(
        502,
        "PAYPAL_INVALID_RESPONSE",
        "PayPal returned an invalid authentication response",
      );
    }

    if (
      !response.ok ||
      !("access_token" in result)
    ) {
      const message =
        "message" in result
          ? result.message
          : undefined;

      throw new AppError(
        502,
        "PAYPAL_AUTHENTICATION_FAILED",
        message ??
          "Unable to authenticate with PayPal",
      );
    }

    this.accessToken = result.access_token;

    // Refresh slightly before the actual expiration
    // to avoid using a token at the edge of expiry.
    this.accessTokenExpiresAt =
      Date.now() +
      Math.max(
        result.expires_in - 60,
        1,
      ) *
        1000;

    return result.access_token;
  }


  async createOrder(
    input: PayPalCreateOrderRequest,
    idempotencyKey: string,
  ): Promise<PayPalCreateOrderResponse> {
    return this.request<PayPalCreateOrderResponse>(
      "/v2/checkout/orders",
      {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          Prefer: "return=representation",
          "PayPal-Request-Id": idempotencyKey,
        },
      },
    );
  }


  async getOrder(
    orderId: string,
  ): Promise<PayPalOrderDetails> {
    return this.request<PayPalOrderDetails>(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}`,
      {
        method: "GET",
      },
    );
  }


  async captureOrder(
    orderId: string,
    idempotencyKey: string,
  ): Promise<PayPalCaptureResponse> {
    return this.request<PayPalCaptureResponse>(
      `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "PayPal-Request-Id": idempotencyKey,
        },
      },
    );
  }


  async refundCapture(
    captureId: string,
    input: PayPalRefundRequest,
    idempotencyKey: string,
  ): Promise<PayPalRefundResponse> {
    return this.request<PayPalRefundResponse>(
      `/v2/payments/captures/${encodeURIComponent(captureId)}/refund`,
      {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          Prefer: "return=representation",
          "PayPal-Request-Id": idempotencyKey,
        },
      },
    );
  }


  /**
   * Verifies that an incoming PayPal webhook was
   * genuinely sent by PayPal and was not modified.
   *
   * Verification is performed using PayPal's
   * verify-webhook-signature REST endpoint.
   */
  async verifyWebhookSignature(
    headers: PayPalWebhookVerificationHeaders,
    event: PayPalWebhookEvent,
  ): Promise<boolean> {
    const config = getPayPalConfig();

    const input: PayPalVerifyWebhookSignatureRequest = {
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: config.webhookId,
      webhook_event: event,
    };

    const result =
      await this.request<PayPalVerifyWebhookSignatureResponse>(
        "/v1/notifications/verify-webhook-signature",
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );

    return result.verification_status === "SUCCESS";
  }


  async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const config = getPayPalConfig();

    const accessToken =
      await this.getAccessToken();

    const response = await fetch(
      `${config.baseUrl}${path}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
    );

    const responseText =
      await response.text();

    let result: unknown = undefined;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new AppError(
          502,
          "PAYPAL_INVALID_RESPONSE",
          "PayPal returned an invalid response",
        );
      }
    }

    if (!response.ok) {
      const error =
        result as PayPalErrorResponse | undefined;

      const detail =
        error?.details?.[0]?.description;

      throw new AppError(
        502,
        "PAYPAL_API_ERROR",
        detail ??
          error?.message ??
          `PayPal API request failed with status ${response.status}`,
      );
    }

    return result as T;
  }
}


export const paypalClient =
  new PayPalClient();