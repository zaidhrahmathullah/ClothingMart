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
  capturePayPalPayment,
} from "./providers/paypal/paypal-payment.service.js";

import {
  paymentProviderRegistry,
} from "./providers/provider.registry.js";

import {
  registerPaymentProviders,
} from "./providers/provider.registry.js";


const testRunId = randomUUID();

const testUserEmail =
  `payment-capture-recovery-${testRunId}@example.com`;

let testUserId: string;

let testCategoryId: string;
let testProductId: string;


before(async () => {
  /*
   * Tests execute payment.service.ts directly rather than
   * starting server.ts, so providers must be registered
   * explicitly for this isolated test process.
   */
  registerPaymentProviders();

  const testUser =
    await prisma.user.create({
      data: {
        name:
          "Payment Capture Recovery Test User",

        email: testUserEmail,

        passwordHash:
          "payment-capture-recovery-test-only",

        role: "CUSTOMER",
      },
    });

  testUserId = testUser.id;

  const category =
    await prisma.category.create({
      data: {
        name:
          `Capture Recovery Category ${testRunId}`,

        slug:
          `capture-recovery-category-${testRunId}`,
      },
    });

  testCategoryId = category.id;

  const product =
    await prisma.product.create({
      data: {
        categoryId:
          testCategoryId,

        name:
          "Capture Recovery Test Product",

        slug:
          `capture-recovery-product-${testRunId}`,

        description:
          "Payment capture recovery test product",

        isActive: true,
      },
    });

  testProductId = product.id;
});


after(async () => {
  await prisma.order.deleteMany({
    where: {
      userId: testUserId,
    },
  });

  await prisma.product.deleteMany({
    where: {
      id: testProductId,
    },
  });

  await prisma.category.deleteMany({
    where: {
      id: testCategoryId,
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
  "COMPLETED PayPal verification recovers existing capture without capturing again",
  async () => {
    const providerOrderId =
      `PAYPAL-ORDER-${randomUUID()}`;

    const providerCaptureId =
      `PAYPAL-CAPTURE-${randomUUID()}`;


    const variant =
      await prisma.productVariant.create({
        data: {
          productId:
            testProductId,

          sku:
            `CAPTURE-RECOVERY-${randomUUID()}`,

          size: "TEST",

          color: "Test Color",

          price: "1000.00",

          inventory: {
            create: {
              quantity: 10,
            },
          },
        },
      });


    const order =
      await prisma.order.create({
        data: {
          userId: testUserId,

          status: OrderStatus.PENDING,

          subtotal: "1000.00",
          shippingFee: "250.00",
          total: "1250.00",

          shippingFullName:
            "Capture Recovery Test User",

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


          items: {
            create: {
              productVariantId:
                variant.id,

              productName:
                "Capture Recovery Test Product",

              variantDescription:
                "TEST / Test Color",

              unitPrice:
                "1000.00",

              quantity: 1,

              subtotal:
                "1000.00",
            },
          },
          payment: {
            create: {
              provider:
                PaymentProvider.PAYPAL,

              status:
                PaymentStatus.PROCESSING,

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

    const provider =
      paymentProviderRegistry.get("PAYPAL");

    /*
     * Keep the original provider methods so this test
     * never permanently mutates the registered provider.
     */
    const originalVerifyPayment =
      provider.verifyPayment;

    const originalCapturePayment =
      provider.capturePayment;

    let capturePaymentCallCount = 0;

    try {
      /*
       * Simulate the important uncertain-outcome case:
       *
       * ClothingMart still has PROCESSING locally,
       * but PayPal already reports the order COMPLETED
       * and returns the existing capture ID.
       */
      provider.verifyPayment =
        async () => ({
          providerPaymentId:
            providerCaptureId,

          providerOrderId,

          status: "COMPLETED",

          amount: "4.00",
          currency: "USD",
        });

      /*
       * This method must NEVER be reached for the
       * COMPLETED recovery path.
       */
      provider.capturePayment =
        async () => {
          capturePaymentCallCount += 1;

          throw new Error(
            "capturePayment must not be called while recovering an already-completed PayPal capture",
          );
        };

      await capturePayPalPayment(
        testUserId,
        order.id,
        providerOrderId,
      );

      /*
       * Core Step 7 guarantee:
       * no second PayPal capture request was sent.
       */
      assert.equal(
        capturePaymentCallCount,
        0,
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
        PaymentStatus.COMPLETED,
      );

      assert.equal(
        updatedPayment.providerOrderId,
        providerOrderId,
      );

      assert.equal(
        updatedPayment.providerPaymentId,
        providerCaptureId,
      );

      assert.equal(
        updatedPayment.transactionReference,
        providerCaptureId,
      );

      assert.equal(
        updatedOrder.status,
        OrderStatus.CONFIRMED,
      );

      assert.ok(
  updatedOrder.finalizedAt,
);

const updatedInventory =
  await prisma.inventory.findUniqueOrThrow({
    where: {
      variantId:
        variant.id,
    },
  });

assert.equal(
  updatedInventory.quantity,
  9,
);
    } finally {
      provider.verifyPayment =
        originalVerifyPayment;

      provider.capturePayment =
        originalCapturePayment;
    }
  },
);



test(
  "concurrent capture requests converge on the same completed PayPal capture",
  async () => {
    const providerOrderId =
      `PAYPAL-ORDER-CONCURRENT-${randomUUID()}`;

    const providerCaptureId =
      `PAYPAL-CAPTURE-CONCURRENT-${randomUUID()}`;

    const variant =
  await prisma.productVariant.create({
    data: {
      productId:
        testProductId,

      sku:
        `CAPTURE-CONCURRENT-${randomUUID()}`,

      size: "TEST",

      color: "Concurrent Test Color",

      price: "1000.00",

      inventory: {
        create: {
          quantity: 10,
        },
      },
    },
  });

    const order =
      await prisma.order.create({
        data: {
          userId: testUserId,

          status: OrderStatus.PENDING,

          subtotal: "1000.00",
          shippingFee: "250.00",
          total: "1250.00",

          shippingFullName:
            "Concurrent Capture Test User",

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


          items: {
  create: {
    productVariantId:
      variant.id,

    productName:
      "Capture Recovery Test Product",

    variantDescription:
      "TEST / Concurrent Test Color",

    unitPrice:
      "1000.00",

    quantity: 1,

    subtotal:
      "1000.00",
  },
},


          payment: {
            create: {
              provider:
                PaymentProvider.PAYPAL,

              status:
                PaymentStatus.PROCESSING,

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

    const provider =
      paymentProviderRegistry.get("PAYPAL");

    const originalVerifyPayment =
      provider.verifyPayment;

    const originalCapturePayment =
      provider.capturePayment;

    let verifyCallCount = 0;
    let captureCallCount = 0;

    /*
     * Both requests must finish verification before either
     * verification call is released.
     *
     * This guarantees both service calls already loaded the
     * local Payment while it was still PROCESSING.
     */
    let releaseVerification:
      (() => void) | undefined;

    const verificationBarrier =
      new Promise<void>((resolve) => {
        releaseVerification = resolve;
      });

    try {
      provider.verifyPayment =
        async () => {
          verifyCallCount += 1;

          if (verifyCallCount === 2) {
            releaseVerification?.();
          }

          await verificationBarrier;

          return {
            /*
             * Before capture, PayPal Order verification
             * represents the PayPal Order itself.
             */
            providerPaymentId:
              providerOrderId,

            providerOrderId,

            status: "APPROVED",

            amount: "4.00",
            currency: "USD",
          };
        };

      provider.capturePayment =
        async (
          receivedProviderOrderId,
          idempotencyKey,
        ) => {
          captureCallCount += 1;

          /*
           * Both concurrent requests must target the same
           * PayPal Order and use the same stable Step 6
           * idempotency identity.
           */
          assert.equal(
            receivedProviderOrderId,
            providerOrderId,
          );

          assert.equal(
            idempotencyKey,
            `payment-capture-${payment.id}`,
          );

          return {
            providerPaymentId:
              providerCaptureId,

            providerOrderId,

            status: "COMPLETED",

            transactionReference:
              providerCaptureId,

            amount: "4.00",
            currency: "USD",
          };
        };

      const results =
        await Promise.all([
          capturePayPalPayment(
            testUserId,
            order.id,
            providerOrderId,
          ),

          capturePayPalPayment(
            testUserId,
            order.id,
            providerOrderId,
          ),
        ]);

      /*
       * The barrier proves both requests entered the provider
       * path from the same original PROCESSING state.
       */
      assert.equal(
        verifyCallCount,
        2,
      );

      /*
       * Two application requests may reach PayPal, but Step 6
       * gives both the same idempotency key and therefore the
       * same logical financial capture identity.
       */
      assert.equal(
        captureCallCount,
        2,
      );

      assert.equal(
        results.length,
        2,
      );

      for (const result of results) {
        assert.equal(
          result.status,
          PaymentStatus.COMPLETED,
        );

        assert.equal(
          result.providerOrderId,
          providerOrderId,
        );

        assert.equal(
          result.providerPaymentId,
          providerCaptureId,
        );

        assert.equal(
          result.transactionReference,
          providerCaptureId,
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
        PaymentStatus.COMPLETED,
      );

      assert.equal(
        updatedPayment.providerOrderId,
        providerOrderId,
      );

      assert.equal(
        updatedPayment.providerPaymentId,
        providerCaptureId,
      );

      assert.equal(
        updatedPayment.transactionReference,
        providerCaptureId,
      );

      assert.equal(
        updatedOrder.status,
        OrderStatus.CONFIRMED,
      );

      assert.ok(
  updatedOrder.finalizedAt,
);

const updatedInventory =
  await prisma.inventory.findUniqueOrThrow({
    where: {
      variantId:
        variant.id,
    },
  });

/*
 * Two concurrent capture requests must converge on one
 * logical Order finalization.
 */
assert.equal(
  updatedInventory.quantity,
  9,
);

    } finally {
      provider.verifyPayment =
        originalVerifyPayment;

      provider.capturePayment =
        originalCapturePayment;
    }
  },
);