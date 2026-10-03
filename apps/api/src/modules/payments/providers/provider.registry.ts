import type { PaymentProvider } from "../payment.provider.js";
import type { PaymentProviderName } from "../payment.types.js";

import { PayPalProvider } from "./paypal/paypal.provider.js";

/**
 * Central registry for all available payment providers.
 */
class PaymentProviderRegistry {
  private readonly providers = new Map<
    PaymentProviderName,
    PaymentProvider
  >();

  register(provider: PaymentProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(
        `Payment provider "${provider.name}" is already registered`,
      );
    }

    this.providers.set(provider.name, provider);
  }

  get(providerName: PaymentProviderName): PaymentProvider {
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(
        `Payment provider "${providerName}" is not registered`,
      );
    }

    return provider;
  }

  has(providerName: PaymentProviderName): boolean {
    return this.providers.has(providerName);
  }
}

export const paymentProviderRegistry =
  new PaymentProviderRegistry();

/**
 * Register all payment providers available to ClothingMart.
 */
export function registerPaymentProviders(): void {
  paymentProviderRegistry.register(
    new PayPalProvider(),
  );


}