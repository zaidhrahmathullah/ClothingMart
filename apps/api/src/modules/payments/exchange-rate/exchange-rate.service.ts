import { convertCurrency } from "./exchange-rate.client.js";

export type ExchangeRateResult = {
  fromCurrency: string;
  toCurrency: string;
  rate: string;
  convertedAmount: string;
};

export interface ExchangeRateService {
  convert(
    amount: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRateResult>;
}

class ExchangeRateServiceImpl implements ExchangeRateService {
  async convert(
    amount: string,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<ExchangeRateResult> {
    return convertCurrency(amount, fromCurrency, toCurrency);
  }
}

export const exchangeRateService = new ExchangeRateServiceImpl();