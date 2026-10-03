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
  createPayPalPayment,
} from "./providers/paypal/paypal-payment.service.js";

import {
  paymentProviderRegistry,
} from "./providers/provider.registry.js";

import {
  registerPaymentProviders,
} from "./providers/provider.registry.js";

import {
  exchangeRateService,
} from "./exchange-rate/exchange-rate.service.js";


const testRunId = randomUUID();

const testUserEmail =
  `payment-creation-idempotency-${testRunId}@example.com`;

let testUserId: string;


async function createPendingPayment() {
  const order =
    await prisma.order.create({
      data: {
        userId: testUserId,

        status: OrderStatus.PENDING,

        subtotal: "1000.00",
        shippingFee: "250.00",
        total: "1250.00",

        shippingFullName:
          "Payment Creation Test User",

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

            status:
              PaymentStatus.PENDING,

            amount: "1250.00",
            currency: "LKR",
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
  };
}


before(async () => {
  registerPaymentProviders();

  const testUser =
    await prisma.user.create({
      data: {
        name:
          "Payment Creation Idempotency Test User",

        email: testUserEmail,

        passwordHash:
          "payment-creation-idempotency-test-only",

        role: "CUSTOMER",
      },
    });

  testUserId = testUser.id;
});


after(async () => {
  await prisma.order.deleteMany({
    where: {
      userId: testUserId,
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: testUserId,
    },
  });

  await prisma.$disconnect();
});


test(
  "repeating payment creation reuses the existing PROCESSING PayPal payment",
  async () => {
    const {
      order,
      payment,
    } = await createPendingPayment();

    const provider =
      paymentProviderRegistry.get("PAYPAL");

    const originalCreatePayment =
      provider.createPayment;

    const originalConvert =
      exchangeRateService.convert;

    const providerOrderId =
      `PAYPAL-ORDER-${randomUUID()}`;

    let createPaymentCallCount = 0;

    try {
      exchangeRateService.convert =
        async () => ({
            fromCurrency: "LKR",
            toCurrency: "USD",
            rate: "0.0032",
            convertedAmount: "4.00",
        });

      provider.createPayment =
        async (input) => {
          createPaymentCallCount += 1;

          assert.equal(
            input.idempotencyKey,
            `payment-create-${payment.id}`,
          );

          return {
            providerOrderId,
            approvalUrl:
              "https://example.com/paypal-approval",
          };
        };

      const firstResult =
        await createPayPalPayment(
          testUserId,
          order.id,
        );

      const secondResult =
        await createPayPalPayment(
          testUserId,
          order.id,
        );

      assert.equal(
        createPaymentCallCount,
        1,
      );

      assert.equal(
        firstResult.paymentId,
        payment.id,
      );

      assert.equal(
        secondResult.paymentId,
        payment.id,
      );

      assert.equal(
        firstResult.providerOrderId,
        providerOrderId,
      );

      assert.equal(
        secondResult.providerOrderId,
        providerOrderId,
      );

      assert.equal(
        secondResult.approvalUrl,
        null,
      );

      assert.equal(
        secondResult.amount,
        "4.00",
      );

      assert.equal(
        secondResult.currency,
        "USD",
      );

      const updatedPayment =
        await prisma.payment.findUniqueOrThrow({
          where: {
            id: payment.id,
          },
        });

      assert.equal(
        updatedPayment.status,
        PaymentStatus.PROCESSING,
      );

      assert.equal(
        updatedPayment.providerOrderId,
        providerOrderId,
      );
    } finally {
      provider.createPayment =
        originalCreatePayment;

      exchangeRateService.convert =
        originalConvert;
    }
  },
);


test(
  "concurrent payment creation requests converge on the same PayPal order",
  async () => {
    const {
      order,
      payment,
    } = await createPendingPayment();

    const provider =
      paymentProviderRegistry.get("PAYPAL");

    const originalCreatePayment =
      provider.createPayment;

    const originalConvert =
      exchangeRateService.convert;

    const providerOrderId =
      `PAYPAL-ORDER-${randomUUID()}`;

    let createPaymentCallCount = 0;

    /*
     * Barrier used to guarantee that both application
     * requests reach provider creation before either
     * provider call is allowed to return.
     */
    let releaseProviderCalls:
      (() => void) | undefined;

    const providerBarrier =
      new Promise<void>((resolve) => {
        releaseProviderCalls = resolve;
      });

    try {
      exchangeRateService.convert =
        async () => ({
          fromCurrency: "LKR",
          toCurrency: "USD",
          rate: "0.0032",
          convertedAmount: "4.00",
        });

      provider.createPayment =
        async (input) => {
          createPaymentCallCount += 1;

          /*
           * Both concurrent requests must identify the
           * provider operation using exactly the same
           * stable PayPal idempotency key.
           */
          assert.equal(
            input.idempotencyKey,
            `payment-create-${payment.id}`,
          );

          if (createPaymentCallCount === 2) {
            releaseProviderCalls?.();
          }

          await providerBarrier;

          /*
           * Simulate PayPal idempotency:
           * the same PayPal-Request-Id converges on the
           * same provider Order.
           */
          return {
            providerOrderId,
            approvalUrl:
              "https://example.com/paypal-approval",
          };
        };

      const results =
        await Promise.all([
          createPayPalPayment(
            testUserId,
            order.id,
          ),

          createPayPalPayment(
            testUserId,
            order.id,
          ),
        ]);

      /*
       * The barrier proves both application requests
       * reached the provider while the local payment
       * was still being created.
       */
      assert.equal(
        createPaymentCallCount,
        2,
      );

      assert.equal(
        results[0].paymentId,
        payment.id,
      );

      assert.equal(
        results[1].paymentId,
        payment.id,
      );

      assert.equal(
        results[0].providerOrderId,
        providerOrderId,
      );

      assert.equal(
        results[1].providerOrderId,
        providerOrderId,
      );

      const updatedPayment =
        await prisma.payment.findUniqueOrThrow({
          where: {
            id: payment.id,
          },
        });

      assert.equal(
        updatedPayment.status,
        PaymentStatus.PROCESSING,
      );

      assert.equal(
        updatedPayment.provider,
        PaymentProvider.PAYPAL,
      );

      assert.equal(
        updatedPayment.providerOrderId,
        providerOrderId,
      );

      const metadata =
        updatedPayment.metadata &&
        typeof updatedPayment.metadata ===
          "object" &&
        !Array.isArray(
          updatedPayment.metadata,
        )
          ? updatedPayment.metadata
          : null;

      assert.ok(metadata);

      assert.equal(
        metadata.paymentAmount,
        "4.00",
      );

      assert.equal(
        metadata.paymentCurrency,
        "USD",
      );
    } finally {
      /*
       * Always release the barrier if an assertion throws
       * before both mocked provider calls arrive.
       */
      releaseProviderCalls?.();

      provider.createPayment =
        originalCreatePayment;

      exchangeRateService.convert =
        originalConvert;
    }
  },
);