/**
 * Payment provider identifiers recognized by ClothingMart.
 *
 * PAYPAL is implemented and registered.
 * PAYHERE is reserved for a future integration.
 *
 * Provider-specific implementations use the shared
 * payment contract and provider registry.
 */
export const PAYMENT_PROVIDERS = {
  PAYPAL: "PAYPAL",
  PAYHERE: "PAYHERE",
} as const;

export type PaymentProviderName =
  (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];


/**
 * Basic information required by the payment layer
 * to create a payment with an external provider.
 *
 * IMPORTANT:
 *
 * The amount must come from the backend/database.
 * It must never be trusted from the frontend.
 */
export type CreatePaymentInput = {
  orderId: string;
  amount: string;
  currency: string;
  idempotencyKey: string;
};


/**
 * Normalized result returned by any payment provider.
 *
 * The rest of ClothingMart should work with this
 * structure instead of depending on PayPal-specific
 * response objects.
 */
export type CreatePaymentResult = {
  providerPaymentId?: string;
  providerOrderId?: string;
  approvalUrl?: string;
};


/**
 * Normalized payment verification result.
 *
 * Provider-specific responses will be converted into
 * this structure by the provider implementation.
 */
export type VerifyPaymentResult = {
  providerPaymentId: string;
  providerOrderId?: string;
  status: string;
  amount?: string;
  currency?: string;
};


/**
 * Normalized capture result.
 *
 * This prevents PayPal-specific response structures
 * from leaking into the rest of the application.
 */
export type CapturePaymentResult = {
  providerPaymentId: string;
  providerOrderId?: string;
  status: string;
  transactionReference?: string;
  amount?: string;
  currency?: string;
};

export type RefundPaymentInput = {
  providerPaymentId: string;
  amount?: string;
  currency?: string;
  idempotencyKey: string;
};

export type RefundPaymentResult = {
  providerRefundId: string;
  status?: string;
  amount?: string;
  currency?: string;
};