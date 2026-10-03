
/**
 * Normalizes PayPal refund webhook resources.
 *
 * PayPal may provide the original capture ID through:
 *
 * 1. resource.supplementary_data.related_ids.capture_id
 * 2. resource.links, where rel === "up"
 *
 * Our refund validation schema expects the first format.
 */

export function normalizePayPalRefundWebhook(
  event: {
    event_type: string;
    resource?: unknown;
    [key: string]: unknown;
  },
) {
  if (
    event.event_type !==
    "PAYMENT.CAPTURE.REFUNDED"
  ) {
    return event;
  }

  const resource = event.resource;

  if (
    !resource ||
    typeof resource !== "object" ||
    Array.isArray(resource)
  ) {
    return event;
  }

  const refundResource =
    resource as Record<string, unknown>;

  const supplementaryData =
    refundResource.supplementary_data;

  if (
    supplementaryData &&
    typeof supplementaryData === "object" &&
    !Array.isArray(supplementaryData)
  ) {
    const relatedIds = (
      supplementaryData as Record<string, unknown>
    ).related_ids;

    if (
      relatedIds &&
      typeof relatedIds === "object" &&
      !Array.isArray(relatedIds)
    ) {
      const existingCaptureId = (
        relatedIds as Record<string, unknown>
      ).capture_id;

      if (
        typeof existingCaptureId === "string" &&
        existingCaptureId.length > 0
      ) {
        return event;
      }
    }
  }

  const links = refundResource.links;

  if (!Array.isArray(links)) {
    return event;
  }

  const captureLink = links.find(
    (link: unknown) =>
      link !== null &&
      typeof link === "object" &&
      "rel" in link &&
      link.rel === "up" &&
      "href" in link &&
      typeof link.href === "string",
  ) as
    | {
        rel: string;
        href: string;
      }
    | undefined;

  const captureMatch = captureLink?.href.match(
    /^https:\/\/api(?:\.sandbox)?\.paypal\.com\/v2\/payments\/captures\/([^/?#]+)\/?$/,
  );

  if (!captureMatch) {
    return event;
  }

  return {
    ...event,

    resource: {
      ...refundResource,

      supplementary_data: {
        related_ids: {
          capture_id: captureMatch[1],
        },
      },
    },
  };
}
