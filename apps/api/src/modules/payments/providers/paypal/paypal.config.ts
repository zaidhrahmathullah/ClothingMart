import "../../../../config/env.js";
import { AppError } from "../../../../lib/app-error.js";

export type PayPalEnvironment = "sandbox" | "live";

const PAYPAL_API_URLS: Record<PayPalEnvironment, string> = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

/**
 * Validate the selected PayPal environment.
 *
 * There is deliberately no silent fallback to Sandbox.
 */
function getPayPalEnvironment(): PayPalEnvironment {
  const environment = process.env.PAYPAL_ENVIRONMENT;

  if (environment !== "sandbox" && environment !== "live") {
    throw new AppError(
      503,
      "PAYPAL_ENVIRONMENT_INVALID",
      "PAYPAL_ENVIRONMENT must be either sandbox or live",
    );
  }

  return environment;
}

/**
 * Validate configuration before allowing PayPal operations.
 */
export function getPayPalConfig() {
  const environment = getPayPalEnvironment();

  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();

  const baseUrl = PAYPAL_API_URLS[environment];


  /**
   * Live payments require two deliberate conditions:
   *
   * 1. The application must run in production mode.
   * 2. Live payments must be explicitly enabled.
   *
   * PAYPAL_ENVIRONMENT=live alone is not sufficient.
   */
  if (environment === "live") {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.PAYPAL_LIVE_ENABLED !== "true"
    ) {
      throw new AppError(
        503,
        "PAYPAL_LIVE_DISABLED",
        "Live PayPal payments are not enabled",
      );
    }
  }

  if (!clientId || !clientSecret) {
    throw new AppError(
      503,
      "PAYMENT_PROVIDER_NOT_CONFIGURED",
      "PayPal payment provider is not configured",
    );
  }

  if (!webhookId) {
    throw new AppError(
      503,
      "PAYPAL_WEBHOOK_NOT_CONFIGURED",
      "PayPal webhook is not configured",
    );
  }

  return {
    environment,
    clientId,
    clientSecret,
    webhookId,
    baseUrl,
  };
}
