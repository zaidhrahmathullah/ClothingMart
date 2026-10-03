import { apiFetch } from "@/lib/api";

export type CreatePayPalPaymentResponse = {
  paymentId: string;
  orderId: string;
  provider: "PAYPAL";
  providerOrderId?: string;
  approvalUrl?: string;
  amount: string;
  currency: string;
};

export type CapturePayPalPaymentResponse = {
  paymentId: string;
  orderId: string;
  provider: "PAYPAL";
  providerOrderId: string | null;
  providerPaymentId: string | null;
  transactionReference: string | null;
  status: string;
  amount: string;
  currency: string;
};

export type CancelPayPalPaymentResponse = {
  paymentId: string;
  orderId: string;
  provider: "PAYPAL";
  providerOrderId: string | null;
  status: "CANCELLED";
};

export async function createPayPalPayment(
  orderId: string,
): Promise<CreatePayPalPaymentResponse> {
  return apiFetch<CreatePayPalPaymentResponse>(
    "/payments",
    {
      method: "POST",
      body: JSON.stringify({
        orderId,
      }),
    },
  );
}

export async function capturePayPalPayment(
  orderId: string,
  providerOrderId: string,
): Promise<CapturePayPalPaymentResponse> {
  return apiFetch<CapturePayPalPaymentResponse>(
    "/payments/capture",
    {
      method: "POST",
      body: JSON.stringify({
        orderId,
        providerOrderId,
      }),
    },
  );
}

export async function cancelPayPalPayment(
  orderId: string,
  providerOrderId: string,
): Promise<CancelPayPalPaymentResponse> {
  return apiFetch<CancelPayPalPaymentResponse>(
    "/payments/cancel",
    {
      method: "POST",
      body: JSON.stringify({
        orderId,
        providerOrderId,
      }),
    },
  );
}