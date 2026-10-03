import { getExchangeRateConfig } from "./exchange-rate.config.js";

type ExchangeRateApiResponse = {
  result: "success" | "error";
  "error-type"?: string;

  base_code?: string;
  target_code?: string;
  conversion_rate?: number;
  conversion_result?: number;
};

export async function convertCurrency(
  amount: string,
  fromCurrency: string,
  toCurrency: string,
) {
  const config = getExchangeRateConfig();

  const normalizedFromCurrency = fromCurrency.toUpperCase();
  const normalizedToCurrency = toCurrency.toUpperCase();

  const url =
    `${config.baseUrl}/${config.apiKey}/pair/` +
    `${normalizedFromCurrency}/${normalizedToCurrency}/${amount}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Exchange rate provider request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as ExchangeRateApiResponse;

  if (data.result !== "success") {
    throw new Error(
      `Exchange rate provider returned an error: ${
        data["error-type"] ?? "UNKNOWN_ERROR"
      }`,
    );
  }

  if (
    typeof data.conversion_rate !== "number" ||
    !Number.isFinite(data.conversion_rate)
  ) {
    throw new Error("Exchange rate provider returned an invalid conversion rate");
  }

  if (
    typeof data.conversion_result !== "number" ||
    !Number.isFinite(data.conversion_result)
  ) {
    throw new Error(
      "Exchange rate provider returned an invalid conversion result",
    );
  }

  return {
    fromCurrency: normalizedFromCurrency,
    toCurrency: normalizedToCurrency,
    rate: data.conversion_rate.toString(),
    convertedAmount: data.conversion_result.toString(),
  };
}