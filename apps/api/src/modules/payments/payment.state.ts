import {
  PaymentStatus,
} from "../../generated/prisma/client.js";

import { AppError } from "../../lib/app-error.js";


/**
 * Defines every valid payment status transition.
 */
const PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  readonly PaymentStatus[]
> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],

  [PaymentStatus.PROCESSING]: [
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.CANCELLED,
  ],

  [PaymentStatus.COMPLETED]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ],

  [PaymentStatus.FAILED]: [],

  [PaymentStatus.CANCELLED]: [],

  [PaymentStatus.REFUNDED]: [],

  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.REFUNDED,
  ],
};


/**
 * Returns true when a payment is allowed to move
 * from the current status to the requested status.
 *
 * Re-applying the same status is considered valid
 * and acts as an idempotent no-op.
 */
export function canTransitionPaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): boolean {
  if (currentStatus === nextStatus) {
    return true;
  }

  return PAYMENT_STATUS_TRANSITIONS[
    currentStatus
  ].includes(nextStatus);
}


/**
 * Returns all statuses that can be reached from
 * the current payment status.
 */
export function getAllowedPaymentTransitions(
  currentStatus: PaymentStatus,
): readonly PaymentStatus[] {
  return PAYMENT_STATUS_TRANSITIONS[
    currentStatus
  ];
}


/**
 * Throws an application error when the transition
 * is not permitted.
 */
export function assertPaymentStatusTransition(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): void {
  if (
    canTransitionPaymentStatus(
      currentStatus,
      nextStatus,
    )
  ) {
    return;
  }

  throw new AppError(
    409,
    "INVALID_PAYMENT_STATUS_TRANSITION",
    `Invalid payment status transition: ${currentStatus} -> ${nextStatus}`,
  );
}


/**
 * Validates and returns the requested next status.
 */
export function transitionPaymentStatus(
  currentStatus: PaymentStatus,
  nextStatus: PaymentStatus,
): PaymentStatus {
  assertPaymentStatusTransition(
    currentStatus,
    nextStatus,
  );

  return nextStatus;
}