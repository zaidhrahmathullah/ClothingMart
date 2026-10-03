import "../../../config/env.js";

import { AppError } from "../../../lib/app-error.js";

const EXCHANGE_RATE_API_KEY =
  process.env.EXCHANGE_RATE_API_KEY;

const EXCHANGE_RATE_API_BASE_URL =
  process.env.EXCHANGE_RATE_API_BASE_URL ??
  "https://v6.exchangerate-api.com/v6";

export const exchangeRateConfig = {
  apiKey: EXCHANGE_RATE_API_KEY,
  baseUrl: EXCHANGE_RATE_API_BASE_URL,
};

export function getExchangeRateConfig() {
  if (!EXCHANGE_RATE_API_KEY) {
    throw new AppError(
      503,
      "EXCHANGE_RATE_PROVIDER_NOT_CONFIGURED",
      "Exchange rate provider is not configured",
    );
  }

  return {
    apiKey: EXCHANGE_RATE_API_KEY,
    baseUrl: EXCHANGE_RATE_API_BASE_URL,
  };
}