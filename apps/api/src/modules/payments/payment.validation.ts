import { z } from "zod";

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export const capturePaymentSchema = z.object({
  orderId: z.string().uuid(),
  providerOrderId: z.string().min(1),
});

export const cancelPaymentSchema = z.object({
  orderId: z.string().uuid(),
  providerOrderId: z.string().min(1),
});

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;

export type CapturePaymentInput = z.infer<
  typeof capturePaymentSchema
>;

export type CancelPaymentInput = z.infer<
  typeof cancelPaymentSchema
>;