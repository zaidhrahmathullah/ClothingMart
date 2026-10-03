import { z } from "zod";

export const REFUND_REASONS = [
  "CUSTOMER_REQUEST",
  "DUPLICATE_PAYMENT",
  "ORDER_ISSUE",
  "PRODUCT_ISSUE",
  "OTHER",
] as const;

export const createPaymentRefundSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      "Refund amount must be a valid monetary amount",
    )
    .optional(),

  reason: z.enum(REFUND_REASONS),

  adminNote: z
    .string()
    .trim()
    .max(1000)
    .optional(),

  idempotencyKey: z
    .string()
    .trim()
    .min(16)
    .max(200),
});

export type CreatePaymentRefundInput =
  z.infer<typeof createPaymentRefundSchema>;