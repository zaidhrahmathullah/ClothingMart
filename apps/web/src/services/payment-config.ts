
export type PublicPayPalConfig = {
  provider: "PAYPAL";
  environment: "sandbox" | "live";
  clientId: string;
  currency: "USD";
  intent: "capture";
};

type PayPalConfigResponse = {
  success: boolean;
  data: PublicPayPalConfig;
};

/**
 * Fetch the public PayPal SDK configuration
 * from the ClothingMart backend.
 *
 * The backend remains the single source of truth
 * for Sandbox/Live selection and Client ID.
 */
export async function getPublicPayPalConfig(
  signal?: AbortSignal,
): Promise<PublicPayPalConfig> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not configured.",
    );
  }

  const response = await fetch(
    `${apiUrl.replace(/\/+$/, "")}/payments/config/paypal`,
    {
      method: "GET",
      cache: "no-store",
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      "Unable to load PayPal configuration.",
    );
  }

  const result =
    (await response.json()) as PayPalConfigResponse;

  if (
    result.success !== true ||
    result.data?.provider !== "PAYPAL" ||
    !result.data.clientId ||
    !["sandbox", "live"].includes(result.data.environment) ||
    result.data.currency !== "USD" ||
    result.data.intent !== "capture"
  ) {
    throw new Error(
      "Invalid PayPal configuration received from the server.",
    );
  }

  return result.data;
}
