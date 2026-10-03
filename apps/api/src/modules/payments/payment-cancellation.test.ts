import assert from "node:assert/strict";
import {
  after,
  before,
  test,
} from "node:test";
import { randomUUID } from "node:crypto";

import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  cancelPayPalPayment,
} from "./providers/paypal/paypal-payment.service.js";

const testRunId = randomUUID();

const testUserEmail =
  `payment-cancellation-${testRunId}@example.com`;

const otherUserEmail =
  `payment-cancellation-other-${testRunId}@example.com`;

let testUserId: string;
let otherUserId: string;

async function createTestPayment(
  status: PaymentStatus =
    PaymentStatus.PROCESSING,
) {
  const providerOrderId =
    `PAYPAL-ORDER-${randomUUID()}`;

  const order = await prisma.order.create({
    data: {
      userId: testUserId,

      status: OrderStatus.PENDING,

      subtotal: "1000.00",
      shippingFee: "250.00",
      total: "1250.00",

      shippingFullName:
        "Cancellation Test User",

      shippingPhone:
        "0771234567",

      shippingAddressLine1:
        "Test Address",

      shippingAddressLine2: null,

      shippingCity: "Test City",

      shippingDistrict:
        "Test District",

      shippingPostalCode: "00000",

      shippingCountry: "Sri Lanka",

      payment: {
        create: {
          provider:
            PaymentProvider.PAYPAL,

          status,

          amount: "1250.00",
          currency: "LKR",

          providerOrderId,

          metadata: {
            baseCurrency: "LKR",
            baseAmount: "1250.00",
            paymentCurrency: "USD",
            paymentAmount: "4.00",
            exchangeRate: "0.0032",
          },
        },
      },
    },

    include: {
      payment: true,
    },
  });

  const payment = order.payment[0];

  assert.ok(payment);

  return {
    order,
    payment,
    providerOrderId,
  };
}

before(async () => {
  const testUser =
    await prisma.user.create({
      data: {
        name:
          "Payment Cancellation Test User",

        email: testUserEmail,

        passwordHash:
          "payment-cancellation-test-only",

        role: "CUSTOMER",
      },
    });

  const otherUser =
    await prisma.user.create({
      data: {
        name:
          "Other Payment Cancellation User",

        email: otherUserEmail,

        passwordHash:
          "payment-cancellation-test-only",

        role: "CUSTOMER",
      },
    });

  testUserId = testUser.id;
  otherUserId = otherUser.id;
});

after(async () => {
  await prisma.order.deleteMany({
    where: {
      userId: {
        in: [
          testUserId,
          otherUserId,
        ],
      },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: {
        in: [
          testUserId,
          otherUserId,
        ],
      },
    },
  });

  await prisma.$disconnect();
});

test(
  "PROCESSING PayPal payment can be cancelled while order remains pending",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } = await createTestPayment();

    const result =
      await cancelPayPalPayment(
        testUserId,
        order.id,
        providerOrderId,
      );

    assert.equal(
      result.status,
      PaymentStatus.CANCELLED,
    );

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    const updatedOrder =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });

    assert.equal(
      updatedPayment.status,
      PaymentStatus.CANCELLED,
    );

    assert.equal(
      updatedOrder.status,
      OrderStatus.PENDING,
    );
  },
);

test(
  "repeating cancellation of a CANCELLED payment is idempotent",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } = await createTestPayment();

    await cancelPayPalPayment(
      testUserId,
      order.id,
      providerOrderId,
    );

    const result =
      await cancelPayPalPayment(
        testUserId,
        order.id,
        providerOrderId,
      );

    assert.equal(
      result.status,
      PaymentStatus.CANCELLED,
    );

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    assert.equal(
      updatedPayment.status,
      PaymentStatus.CANCELLED,
    );
  },
);

test(
  "COMPLETED payment cannot be cancelled",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment(
        PaymentStatus.COMPLETED,
      );

    await assert.rejects(
      () =>
        cancelPayPalPayment(
          testUserId,
          order.id,
          providerOrderId,
        ),

      (error: unknown) => {
        assert.ok(error instanceof Error);

        const appError =
          error as Error & {
            statusCode?: number;
            code?: string;
          };

        assert.equal(
          appError.statusCode,
          409,
        );

        assert.equal(
          appError.code,
          "PAYMENT_ALREADY_COMPLETED",
        );

        return true;
      },
    );

    const unchangedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    assert.equal(
      unchangedPayment.status,
      PaymentStatus.COMPLETED,
    );
  },
);

test(
  "FAILED payment cannot be cancelled",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment(
        PaymentStatus.FAILED,
      );

    await assert.rejects(
      () =>
        cancelPayPalPayment(
          testUserId,
          order.id,
          providerOrderId,
        ),

      (error: unknown) => {
        assert.ok(error instanceof Error);

        const appError =
          error as Error & {
            statusCode?: number;
            code?: string;
          };

        assert.equal(
          appError.statusCode,
          409,
        );

        assert.equal(
          appError.code,
          "PAYMENT_ALREADY_FAILED",
        );

        return true;
      },
    );

    const unchangedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    assert.equal(
      unchangedPayment.status,
      PaymentStatus.FAILED,
    );
  },
);

test(
  "cancellation with wrong PayPal order ID is rejected",
  async () => {
    const {
      order,
      payment,
    } = await createTestPayment();

    await assert.rejects(
      () =>
        cancelPayPalPayment(
          testUserId,
          order.id,
          `WRONG-${randomUUID()}`,
        ),

      (error: unknown) => {
        assert.ok(error instanceof Error);

        const appError =
          error as Error & {
            statusCode?: number;
            code?: string;
          };

        assert.equal(
          appError.statusCode,
          404,
        );

        assert.equal(
          appError.code,
          "PAYMENT_NOT_FOUND",
        );

        return true;
      },
    );

    const unchangedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    assert.equal(
      unchangedPayment.status,
      PaymentStatus.PROCESSING,
    );
  },
);

test(
  "user cannot cancel another user's order payment",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } = await createTestPayment();

    await assert.rejects(
      () =>
        cancelPayPalPayment(
          otherUserId,
          order.id,
          providerOrderId,
        ),

      (error: unknown) => {
        assert.ok(error instanceof Error);

        const appError =
          error as Error & {
            statusCode?: number;
            code?: string;
          };

        assert.equal(
          appError.statusCode,
          404,
        );

        assert.equal(
          appError.code,
          "ORDER_NOT_FOUND",
        );

        return true;
      },
    );

    const unchangedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    assert.equal(
      unchangedPayment.status,
      PaymentStatus.PROCESSING,
    );
  },
);


test(
  "concurrent cancellation requests converge safely on CANCELLED",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } = await createTestPayment();

    const results =
      await Promise.allSettled([
        cancelPayPalPayment(
          testUserId,
          order.id,
          providerOrderId,
        ),

        cancelPayPalPayment(
          testUserId,
          order.id,
          providerOrderId,
        ),
      ]);

    const fulfilledResults =
      results.filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof cancelPayPalPayment
            >
          >
        > => result.status === "fulfilled",
      );

    const rejectedResults =
      results.filter(
        (
          result,
        ): result is PromiseRejectedResult =>
          result.status === "rejected",
      );

    /*
     * At least one request must perform the actual
     * PROCESSING → CANCELLED transition successfully.
     */
    assert.ok(
      fulfilledResults.length >= 1,
    );

    for (const result of fulfilledResults) {
      assert.equal(
        result.value.status,
        PaymentStatus.CANCELLED,
      );
    }

    /*
     * Depending on PostgreSQL transaction timing, the
     * second request can either:
     *
     * 1. observe CANCELLED and return idempotently, or
     * 2. lose the conditional PROCESSING update race and
     *    receive PAYMENT_STATE_CHANGED.
     *
     * Both are safe outcomes because neither can overwrite
     * the already-cancelled payment.
     */
    for (const result of rejectedResults) {
      assert.ok(
        result.reason instanceof Error,
      );

      const appError =
        result.reason as Error & {
          statusCode?: number;
          code?: string;
        };

      assert.equal(
        appError.statusCode,
        409,
      );

      assert.equal(
        appError.code,
        "PAYMENT_STATE_CHANGED",
      );
    }

    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });

    const updatedOrder =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });

    assert.equal(
      updatedPayment.status,
      PaymentStatus.CANCELLED,
    );

    /*
     * Cancellation changes only the payment attempt.
     * Phase 11 intentionally keeps the Order PENDING.
     */
    assert.equal(
      updatedOrder.status,
      OrderStatus.PENDING,
    );
  },
);