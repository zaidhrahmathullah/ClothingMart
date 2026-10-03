import { z } from "zod";

export const supportedPayPalWebhookEventTypes = [
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.PENDING",
  "PAYMENT.CAPTURE.DENIED",
] as const;

export const paypalWebhookEventSchema = z
  .object({
    id: z.string().min(1),
    event_type: z.string().min(1),
    create_time: z.string().optional(),
    resource_type: z.string().optional(),
    summary: z.string().optional(),
    resource: z.unknown(),
  })
  .passthrough();

export const paypalCaptureWebhookResourceSchema =
  z.object({
    id: z.string().min(1),
    status: z.string().optional(),
    supplementary_data: z.object({
      related_ids: z.object({
        order_id: z.string().min(1),
      }),
    }),
  });

export const paypalCaptureWebhookEventSchema =
  paypalWebhookEventSchema.extend({
    event_type: z.enum(
      supportedPayPalWebhookEventTypes,
    ),
    resource: paypalCaptureWebhookResourceSchema,
  });

export const paypalRefundWebhookResourceSchema =
  z.object({
    id: z.string().min(1),
    status: z.string().optional(),
    amount: z.object({
      value: z.string().min(1),
      currency_code: z.string().min(1),
    }),
    supplementary_data: z.object({
      related_ids: z.object({
        capture_id: z.string().min(1),
      }),
    }),
  });

export const paypalRefundWebhookEventSchema =
  paypalWebhookEventSchema.extend({
    event_type: z.literal(
      "PAYMENT.CAPTURE.REFUNDED",
    ),
    resource: paypalRefundWebhookResourceSchema,
  });

export type PayPalWebhookEventInput = z.infer<
  typeof paypalWebhookEventSchema
>;

export type PayPalCaptureWebhookEventInput =
  z.infer<typeof paypalCaptureWebhookEventSchema>;

export type PayPalRefundWebhookEventInput =
  z.infer<typeof paypalRefundWebhookEventSchema>;