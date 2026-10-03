import { PaymentProvider } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Find an existing webhook event for any payment provider.
 */
async function getProcessedWebhookEvent(
  provider: PaymentProvider,
  providerEventId: string,
) {
  return prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider,
        providerEventId,
      },
    },
  });
}

/**
 * Return true only when this exact provider event
 * has already completed processing.
 *
 * An existing row with processedAt = null must not
 * be treated as successfully processed.
 */
export async function isWebhookEventProcessed(
  provider: PaymentProvider,
  providerEventId: string,
): Promise<boolean> {
  const webhookEvent = await getProcessedWebhookEvent(
    provider,
    providerEventId,
  );

  return Boolean(webhookEvent?.processedAt);
}