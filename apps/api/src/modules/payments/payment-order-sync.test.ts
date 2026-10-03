import assert from "node:assert/strict";
import test from "node:test";

import {
  OrderStatus,
  PaymentStatus,
} from "../../generated/prisma/client.js";

import {
  getOrderStatusAfterCompletedPayment,
  shouldConfirmOrderForPayment,
} from "./payment-order-sync.js";

/*
 * ============================================================
 * getOrderStatusAfterCompletedPayment()
 * ============================================================
 */

test(
  "completed payment confirms a pending order",
  () => {
    const nextStatus =
      getOrderStatusAfterCompletedPayment(
        OrderStatus.PENDING,
      );

    assert.equal(
      nextStatus,
      OrderStatus.CONFIRMED,
    );
  },
);

test(
  "completed payment keeps a confirmed order confirmed",
  () => {
    const nextStatus =
      getOrderStatusAfterCompletedPayment(
        OrderStatus.CONFIRMED,
      );

    assert.equal(
      nextStatus,
      OrderStatus.CONFIRMED,
    );
  },
);

test(
  "completed payment does not regress a processing order",
  () => {
    const nextStatus =
      getOrderStatusAfterCompletedPayment(
        OrderStatus.PROCESSING,
      );

    assert.equal(
      nextStatus,
      OrderStatus.PROCESSING,
    );
  },
);

test(
  "completed payment does not regress a shipped order",
  () => {
    const nextStatus =
      getOrderStatusAfterCompletedPayment(
        OrderStatus.SHIPPED,
      );

    assert.equal(
      nextStatus,
      OrderStatus.SHIPPED,
    );
  },
);

test(
  "completed payment does not regress a delivered order",
  () => {
    const nextStatus =
      getOrderStatusAfterCompletedPayment(
        OrderStatus.DELIVERED,
      );

    assert.equal(
      nextStatus,
      OrderStatus.DELIVERED,
    );
  },
);

test(
  "completed payment conflicts with a cancelled order",
  () => {
    assert.throws(
      () =>
        getOrderStatusAfterCompletedPayment(
          OrderStatus.CANCELLED,
        ),
      (error: unknown) => {
        assert.ok(error instanceof Error);

        const appError = error as Error & {
          statusCode?: number;
          code?: string;
        };

        assert.equal(
          appError.statusCode,
          409,
        );

        assert.equal(
          appError.code,
          "ORDER_PAYMENT_SYNC_CONFLICT",
        );

        return true;
      },
    );
  },
);

/*
 * ============================================================
 * shouldConfirmOrderForPayment()
 * ============================================================
 */

test(
  "completed payment requires order confirmation synchronization",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.COMPLETED,
      ),
      true,
    );
  },
);

test(
  "pending payment does not confirm order",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.PENDING,
      ),
      false,
    );
  },
);

test(
  "processing payment does not confirm order",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.PROCESSING,
      ),
      false,
    );
  },
);

test(
  "failed payment does not confirm order",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.FAILED,
      ),
      false,
    );
  },
);

test(
  "cancelled payment does not confirm order",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.CANCELLED,
      ),
      false,
    );
  },
);

test(
  "refunded payment does not trigger order confirmation",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.REFUNDED,
      ),
      false,
    );
  },
);

test(
  "partially refunded payment does not trigger order confirmation",
  () => {
    assert.equal(
      shouldConfirmOrderForPayment(
        PaymentStatus.PARTIALLY_REFUNDED,
      ),
      false,
    );
  },
);