import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, mock, test } from "node:test";

import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  RefundStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import { createAdminPaymentRefund } from "./payment-refund.service.js";

import { synchronizeRefundedPayPalWebhook } from "./providers/paypal/paypal-webhook.service.js";

import { paymentProviderRegistry } from "./providers/provider.registry.js";

import type {
  PaymentProvider as PaymentProviderContract,
} from "./payment.provider.js";

import type {
  RefundPaymentInput,
  RefundPaymentResult,
} from "./payment.types.js";

import type {
  PayPalRefundWebhookEventInput,
} from "./providers/paypal/paypal-webhook.validation.js";

const runId = randomUUID();

let userId: string;
let adminId: string;
let categoryId: string;
let productId: string;

const calls: RefundPaymentInput[] = [];

let reply: (
  input: RefundPaymentInput,
) => Promise<RefundPaymentResult>;

/*
 * Replace the provider registry lookup with a controlled
 * test implementation.
 *
 * No actual PayPal refund requests are sent.
 */
function installFakeProvider() {
  const fakeProvider = {
    name: "PAYPAL",

    refundPayment: async (
      input: RefundPaymentInput,
    ) => {
      calls.push(input);

      return reply(input);
    },
  } as PaymentProviderContract;

  mock.method(
    paymentProviderRegistry,
    "get",
    () => fakeProvider,
  );
}

function providerCompleted(
  input: RefundPaymentInput,
): Promise<RefundPaymentResult> {
  return Promise.resolve({
    providerRefundId: `REFUND-${randomUUID()}`,
    status: "COMPLETED",
    amount: input.amount,
    currency: input.currency,
  });
}

/*
 * Create an isolated payment/order fixture.
 */
async function fixture(
  status: PaymentStatus = PaymentStatus.COMPLETED,
) {
  const variant =
    await prisma.productVariant.create({
      data: {
        productId,

        sku: `REFUND-TEST-${randomUUID()}`,

        size: "TEST",
        color: "Test",

        price: "1000.00",

        inventory: {
          create: {
            quantity: 10,
          },
        },
      },
    });

  const order = await prisma.order.create({
    data: {
      userId,

      status: OrderStatus.CONFIRMED,

      finalizedAt: new Date(),

      subtotal: "1000.00",
      shippingFee: "250.00",
      total: "1250.00",

      shippingFullName: "Refund Test",
      shippingPhone: "0771234567",
      shippingAddressLine1: "Test Street",
      shippingCity: "Test City",
      shippingDistrict: "Test District",
      shippingPostalCode: "00000",
      shippingCountry: "Sri Lanka",

      items: {
        create: {
          productVariantId: variant.id,
          productName: "Refund Test Product",
          variantDescription: "TEST / Test",
          unitPrice: "1000.00",
          quantity: 1,
          subtotal: "1000.00",
        },
      },

      payment: {
        create: {
          provider: PaymentProvider.PAYPAL,

          status,

          amount: "1250.00",
          currency: "LKR",

          providerOrderId:
            `ORDER-${randomUUID()}`,

          providerPaymentId:
            `CAPTURE-${randomUUID()}`,

          metadata: {
            baseCurrency: "LKR",
            baseAmount: "1250.00",

            paymentCurrency: "USD",
            paymentAmount: "10.00",

            exchangeRate: "0.008",
          },
        },
      },
    },

    include: {
      payment: true,
    },
  });

  return {
    order,
    payment: order.payment[0]!,
    variant,
  };
}

/*
 * Build an admin refund request.
 */
function request(
  amount?: string,
  key = randomUUID(),
) {
  return {
    ...(
      amount === undefined
        ? {}
        : { amount }
    ),

    reason: "CUSTOMER_REQUEST" as const,

    adminNote: "Automated test",

    idempotencyKey: key,
  };
}

/*
 * Simulate a PayPal refund webhook.
 */
function refundWebhook(
  captureId: string,
  refundId: string,
  amount: string,
): PayPalRefundWebhookEventInput {
  return {
    id: `EVENT-${randomUUID()}`,

    event_type: "PAYMENT.CAPTURE.REFUNDED",

    resource: {
      id: refundId,

      status: "COMPLETED",

      amount: {
        value: amount,
        currency_code: "USD",
      },

      supplementary_data: {
        related_ids: {
          capture_id: captureId,
        },
      },
    },
  };
}

/*
 * Verify an expected application error code.
 */
async function expectCode(
  action: () => Promise<unknown>,
  code: string,
) {
  await assert.rejects(
    action,

    (error: unknown) => {
      assert.equal(
        (error as { code?: string }).code,
        code,
      );

      return true;
    },
  );
}

/*
 * Create temporary test data.
 */
before(async () => {
  const user = await prisma.user.create({
    data: {
      name: "Refund Test Customer",

      email:
        `refund-customer-${runId}@example.com`,

      passwordHash: "test-only",

      role: "CUSTOMER",
    },
  });

  userId = user.id;

  const admin = await prisma.user.create({
    data: {
      name: "Refund Test Admin",

      email:
        `refund-admin-${runId}@example.com`,

      passwordHash: "test-only",

      role: "ADMIN",
    },
  });

  adminId = admin.id;

  const category =
    await prisma.category.create({
      data: {
        name: `Refund Test ${runId}`,

        slug: `refund-test-${runId}`,
      },
    });

  categoryId = category.id;

  const product =
    await prisma.product.create({
      data: {
        categoryId,

        name: "Refund Test Product",

        slug:
          `refund-test-product-${runId}`,

        description:
          "Refund integration test fixture",

        isActive: true,
      },
    });

  productId = product.id;

  reply = providerCompleted;

  installFakeProvider();
});

/*
 * Remove test data after the tests.
 */
after(async () => {
  mock.restoreAll();

  if (userId) {
    const payments =
      await prisma.payment.findMany({
        where: {
          order: {
            userId,
          },
        },

        select: {
          id: true,
        },
      });

    await prisma.paymentWebhookEvent.deleteMany({
      where: {
        paymentId: {
          in: payments.map(
            (payment) => payment.id,
          ),
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        userId,
      },
    });
  }

  if (productId) {
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });
  }

  if (categoryId) {
    await prisma.category.delete({
      where: {
        id: categoryId,
      },
    });
  }

  if (adminId) {
    await prisma.user.delete({
      where: {
        id: adminId,
      },
    });
  }

  if (userId) {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }

  await prisma.$disconnect();
});

/*
 * TEST 1
 * Full refund and order/inventory preservation.
 */
test(
  "full refund uses original USD amount and preserves order/inventory",

  async () => {
    calls.length = 0;

    reply = providerCompleted;

    const {
      payment,
      order,
      variant,
    } = await fixture();

    const result =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        request(),
      );

    assert.equal(
      result.status,
      RefundStatus.COMPLETED,
    );

    assert.equal(
      result.paymentStatus,
      PaymentStatus.REFUNDED,
    );

    assert.equal(calls.length, 1);

    assert.equal(
      calls[0]!.providerPaymentId,
      payment.providerPaymentId,
    );

    assert.equal(
      calls[0]!.amount,
      "10.00",
    );

    assert.equal(
      calls[0]!.currency,
      "USD",
    );

    const currentOrder =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });

    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId: variant.id,
        },
      });

    assert.equal(
      currentOrder.status,
      OrderStatus.CONFIRMED,
    );

    assert.equal(
      inventory.quantity,
      10,
    );
  },
);

/*
 * TEST 2
 * Multiple partial refunds.
 */
test(
  "two partial refunds add to full refund and prevent further claims",

  async () => {
    reply = providerCompleted;

    const { payment } = await fixture();

    const first =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        request("3.00"),
      );

    assert.equal(
      first.paymentStatus,
      PaymentStatus.PARTIALLY_REFUNDED,
    );

    const second =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        request("7.00"),
      );

    assert.equal(
      second.paymentStatus,
      PaymentStatus.REFUNDED,
    );

    assert.equal(
      await prisma.paymentRefund.count({
        where: {
          paymentId: payment.id,
        },
      }),
      2,
    );

    await expectCode(
      () =>
        createAdminPaymentRefund(
          adminId,
          payment.id,
          request("1.00"),
        ),

      "PAYMENT_NOT_REFUNDABLE",
    );
  },
);

/*
 * TEST 3
 * Duplicate/idempotent refund requests.
 */
test(
  "same idempotency key does not repeat a completed provider refund",

  async () => {
    reply = providerCompleted;

    calls.length = 0;

    const { payment } = await fixture();

    const input = request("2.00");

    const first =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        input,
      );

    const second =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        input,
      );

    assert.equal(
      first.refundId,
      second.refundId,
    );

    assert.equal(calls.length, 1);

    await expectCode(
      () =>
        createAdminPaymentRefund(
          adminId,
          payment.id,
          {
            ...input,
            amount: "3.00",
          },
        ),

      "REFUND_IDEMPOTENCY_CONFLICT",
    );
  },
);

/*
 * TEST 4
 * Pending refunds reserve refundable balance.
 */
test(
  "pending provider outcome reserves the refundable balance",

  async () => {
    reply = async (input) => ({
      providerRefundId:
        `PENDING-${randomUUID()}`,

      status: "PENDING",

      amount: input.amount,

      currency: input.currency,
    });

    const { payment } = await fixture();

    const pending =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        request("8.00"),
      );

    assert.equal(
      pending.status,
      RefundStatus.PENDING,
    );

    await expectCode(
      () =>
        createAdminPaymentRefund(
          adminId,
          payment.id,
          request("3.00"),
        ),

      "REFUND_AMOUNT_EXCEEDS_REMAINING",
    );

    reply = providerCompleted;
  },
);

/*
 * TEST 5
 * Uncertain provider response and safe retry.
 */
test(
  "uncertain provider failure leaves a durable pending claim for retry",

  async () => {
    calls.length = 0;

    const { payment } = await fixture();

    const input = request("4.00");

    reply = async () => {
      throw new Error(
        "Simulated connection loss",
      );
    };

    await expectCode(
      () =>
        createAdminPaymentRefund(
          adminId,
          payment.id,
          input,
        ),

      "REFUND_PROVIDER_OUTCOME_UNCERTAIN",
    );

    const pending =
      await prisma.paymentRefund.findUniqueOrThrow({
        where: {
          idempotencyKey:
            input.idempotencyKey,
        },
      });

    assert.equal(
      pending.status,
      RefundStatus.PENDING,
    );

    reply = providerCompleted;

    const completed =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        input,
      );

    assert.equal(
      completed.refundId,
      pending.id,
    );

    assert.equal(
      completed.status,
      RefundStatus.COMPLETED,
    );

    assert.equal(
      calls[0]!.idempotencyKey,
      calls[1]!.idempotencyKey,
    );
  },
);

/*
 * TEST 6
 * Invalid payment states cannot be refunded.
 */
test(
  "invalid payment state cannot be refunded",

  async () => {
    reply = providerCompleted;

    const { payment } =
      await fixture(
        PaymentStatus.PROCESSING,
      );

    await expectCode(
      () =>
        createAdminPaymentRefund(
          adminId,
          payment.id,
          request(),
        ),

      "PAYMENT_NOT_REFUNDABLE",
    );
  },
);

/*
 * TEST 7
 * Webhook reconciliation and replay protection.
 */
test(
  "refund webhook completes a pending claim, preserves requestType, and is replay-safe",

  async () => {
    reply = async (input) => ({
      providerRefundId:
        `PENDING-${randomUUID()}`,

      status: "PENDING",

      amount: input.amount,

      currency: input.currency,
    });

    const { payment } = await fixture();

    const input = request("4.00");

    const pending =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        input,
      );

    assert.ok(
      pending.providerRefundId,
    );

    const event = refundWebhook(
      payment.providerPaymentId!,
      pending.providerRefundId!,
      "4.00",
    );

    const first =
      await synchronizeRefundedPayPalWebhook(
        event,
      );

    assert.equal(
      first.paymentStatus,
      PaymentStatus.PARTIALLY_REFUNDED,
    );

    const replay =
      await synchronizeRefundedPayPalWebhook(
        event,
      );

    assert.equal(
      replay.alreadyProcessed,
      true,
    );

    const refund =
      await prisma.paymentRefund.findUniqueOrThrow({
        where: {
          idempotencyKey:
            input.idempotencyKey,
        },
      });

    assert.equal(
      refund.status,
      RefundStatus.COMPLETED,
    );

    assert.equal(
      (
        refund.metadata as Record<
          string,
          unknown
        >
      ).requestType,
      "PARTIAL",
    );

    calls.length = 0;

    reply = providerCompleted;

    const retry =
      await createAdminPaymentRefund(
        adminId,
        payment.id,
        input,
      );

    assert.equal(
      retry.status,
      RefundStatus.COMPLETED,
    );

    assert.equal(
      calls.length,
      0,
    );
  },
);

/*
 * TEST 8
 * External PayPal refund synchronization.
 */
test(
  "external PayPal refund creates an auditable record without inventing an admin",

  async () => {
    const { payment } = await fixture();

    const event = refundWebhook(
      payment.providerPaymentId!,

      `EXTERNAL-${randomUUID()}`,

      "2.00",
    );

    await synchronizeRefundedPayPalWebhook(
      event,
    );

    const refund =
      await prisma.paymentRefund.findFirstOrThrow({
        where: {
          paymentId: payment.id,

          providerRefundId:
            event.resource.id,
        },
      });

    assert.equal(
      refund.reason,
      "EXTERNAL_PROVIDER_REFUND",
    );

    assert.equal(
      refund.initiatedById,
      null,
    );

    assert.equal(
      refund.status,
      RefundStatus.COMPLETED,
    );
  },
);