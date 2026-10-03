import { AppError } from "../../lib/app-error.js";

import {
  PaymentStatus,
} from "../../generated/prisma/client.js";

import {
  PAYMENT_PROVIDERS,
  type PaymentProviderName,
} from "./payment.types.js";

import {
  assertPaymentStatusTransition,
  transitionPaymentStatus,
} from "./payment.state.js";

import {
  paymentProviderRegistry,
} from "./providers/provider.registry.js";

/**
 * Resolve a registered payment provider.
 */
export function getPaymentProvider(
  providerName: PaymentProviderName,
) {
  if (
    !Object.values(PAYMENT_PROVIDERS).includes(
      providerName,
    )
  ) {
    throw new AppError(
      400,
      "UNSUPPORTED_PAYMENT_PROVIDER",
      `Unsupported payment provider: ${providerName}`,
    );
  }

  try {
    return paymentProviderRegistry.get(
      providerName,
    );
  } catch {
    throw new AppError(
      503,
      "PAYMENT_PROVIDER_UNAVAILABLE",
      `Payment provider "${providerName}" is not currently available`,
    );
  }
}

/**
 * Validate a payment state transition.
 */
export function validatePaymentStatusTransition(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): void {
  assertPaymentStatusTransition(
    currentStatus,
    nextStatus,
  );
}

/**
 * Calculate the next valid payment status.
 */
export function getNextPaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): PaymentStatus {
  return transitionPaymentStatus(
    currentStatus,
    nextStatus,
  );
}