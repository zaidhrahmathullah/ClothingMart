import {
  OrderStatus,
  PaymentStatus,
} from "../../generated/prisma/client.js";

import { AppError } from "../../lib/app-error.js";

/**
 * Determine the Order status that corresponds to a
 * successfully completed payment.
 *
 * Payment COMPLETED:
 *
 * PENDING   -> CONFIRMED
 * CONFIRMED -> CONFIRMED (idempotent)
 *
 * Orders that have already progressed beyond CONFIRMED
 * must never be moved backwards by payment synchronization.
 */
export function getOrderStatusAfterCompletedPayment(
  currentOrderStatus: OrderStatus,
): OrderStatus {
  switch (currentOrderStatus) {
    case OrderStatus.PENDING:
      return OrderStatus.CONFIRMED;

    case OrderStatus.CONFIRMED:
      return OrderStatus.CONFIRMED;

    case OrderStatus.PROCESSING:
    case OrderStatus.SHIPPED:
    case OrderStatus.DELIVERED:
      return currentOrderStatus;

    case OrderStatus.CANCELLED:
      throw new AppError(
        409,
        "ORDER_PAYMENT_SYNC_CONFLICT",
        "A cancelled order cannot be confirmed by a completed payment",
      );

    default: {
      const exhaustiveCheck: never =
        currentOrderStatus;

      return exhaustiveCheck;
    }
  }
}

/**
 * Determine whether a payment status requires the
 * Order to be synchronized.
 *
 * Phase 9 only confirms an Order after a successful
 * completed payment.
 *
 * Failed/cancelled payment behavior remains separate
 * and will be expanded in Phase 11.
 */
export function shouldConfirmOrderForPayment(
  paymentStatus: PaymentStatus,
): boolean {
  return paymentStatus === PaymentStatus.COMPLETED;
}