import type {
  CapturePaymentResult,
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderName,
  VerifyPaymentResult,
  RefundPaymentInput,
  RefundPaymentResult,
} from "./payment.types.js";


/**
 * Common contract that every payment provider must follow.
 *
 * PayPal, PayHere, Stripe, etc. will implement this
 * interface independently.
 *
 * The PaymentService will communicate with providers
 * through this contract instead of directly calling
 * provider SDKs.
 */
export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createPayment(
    input: CreatePaymentInput,
  ): Promise<CreatePaymentResult>;

  capturePayment(
    providerPaymentId: string,
    idempotencyKey: string,
  ): Promise<CapturePaymentResult>;

  verifyPayment(
    providerPaymentId: string,
  ): Promise<VerifyPaymentResult>;

  cancelPayment(
    providerPaymentId: string,
  ): Promise<void>;

  refundPayment(
    input: RefundPaymentInput,
  ): Promise<RefundPaymentResult>;
}