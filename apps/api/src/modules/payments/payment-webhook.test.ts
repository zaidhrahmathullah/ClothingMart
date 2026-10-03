import assert from "node:assert/strict";
import {
  after,
  before,
  test,
} from "node:test";
import { randomUUID } from "node:crypto";

import {
  normalizePayPalRefundWebhook,
} from "./providers/paypal/paypal-webhook.normalize.js";

import {
  paypalRefundWebhookEventSchema,
  type PayPalCaptureWebhookEventInput,
} from "./providers/paypal/paypal-webhook.validation.js";

import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  synchronizeCompletedPayPalWebhook,
  synchronizeNonSuccessPayPalWebhook,
} from "./providers/paypal/paypal-webhook.service.js";



import {
  isWebhookEventProcessed,
} from "./payment-webhook-event.service.js";



const testRunId = randomUUID();

const testUserEmail =
  `payment-webhook-${testRunId}@example.com`;

let testUserId: string;
let testCategoryId: string;
let testProductId: string;


/**
 * Create one isolated Order + Payment pair.
 *
 * Every test receives its own Order and Payment so
 * webhook state from one test cannot affect another.
 */
async function createTestPayment(
  status: PaymentStatus =
    PaymentStatus.PROCESSING,
) {
  const providerOrderId =
    `PAYPAL-ORDER-${randomUUID()}`;

  const variant =
    await prisma.productVariant.create({
      data: {
        productId:
          testProductId,

        sku:
          `WEBHOOK-${randomUUID()}`,

        size: "TEST",

        color: "Webhook Test Color",

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
          "Webhook Test User",

        shippingPhone:
          "0771234567",

        shippingAddressLine1:
          "Test Address",

        shippingAddressLine2:
          null,

        shippingCity:
          "Test City",

        shippingDistrict:
          "Test District",

        shippingPostalCode:
          "00000",

        shippingCountry:
          "Sri Lanka",

        items: {
          create: {
            productVariantId:
              variant.id,

            productName:
              "Webhook Test Product",

            variantDescription:
              "TEST / Webhook Test Color",

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
    variant,
  };
}


/**
 * Build a validated-shape PayPal capture webhook event.
 *
 * No real PayPal request is made by these service tests.
 */
function createCaptureEvent(
  eventType:
    | "PAYMENT.CAPTURE.COMPLETED"
    | "PAYMENT.CAPTURE.PENDING"
    | "PAYMENT.CAPTURE.DENIED",

  providerOrderId: string,

  providerPaymentId: string =
    `PAYPAL-CAPTURE-${randomUUID()}`,
): PayPalCaptureWebhookEventInput {
  return {
    id:
      `PAYPAL-EVENT-${randomUUID()}`,

    event_type:
      eventType,

    resource: {
      id: providerPaymentId,

      status:
        eventType ===
        "PAYMENT.CAPTURE.COMPLETED"
          ? "COMPLETED"
          : eventType ===
              "PAYMENT.CAPTURE.DENIED"
            ? "DENIED"
            : "PENDING",

      supplementary_data: {
        related_ids: {
          order_id:
            providerOrderId,
        },
      },
    },
  };
}


before(async () => {
  const user =
    await prisma.user.create({
      data: {
        name:
          "Payment Webhook Test User",

        email:
          testUserEmail,

        passwordHash:
          "payment-webhook-test-only",

        role:
          "CUSTOMER",
      },
    });

  testUserId = user.id;


  const category =
    await prisma.category.create({
      data: {
        name:
          `Webhook Category ${testRunId}`,

        slug:
          `webhook-category-${testRunId}`,
      },
    });

  testCategoryId = category.id;


  const product =
    await prisma.product.create({
      data: {
        categoryId:
          testCategoryId,

        name:
          "Webhook Test Product",

        slug:
          `webhook-product-${testRunId}`,

        description:
          "PayPal webhook integration test product",

        isActive: true,
      },
    });

  testProductId = product.id;
});


after(async () => {
  /**
   * Find only Payments belonging to this isolated
   * webhook-test User.
   */
  const testPayments =
    await prisma.payment.findMany({
      where: {
        order: {
          userId: testUserId,
        },
      },

      select: {
        id: true,
      },
    });


  const paymentIds =
    testPayments.map(
      (payment) => payment.id,
    );


  /**
   * PaymentWebhookEvent.payment uses onDelete: SetNull.
   *
   * Delete these explicitly so webhook-test records
   * do not remain in the development database.
   */
  if (paymentIds.length > 0) {
    await prisma.paymentWebhookEvent.deleteMany({
      where: {
        paymentId: {
          in: paymentIds,
        },
      },
    });
  }


  /**
   * Orders still reference the test User.
   *
   * Delete only Orders belonging to our uniquely
   * generated test User. Payment records cascade from
   * Order deletion through Payment.order.
   */
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


  /**
   * The User can now safely be removed because its
   * test Orders no longer reference it.
   */
  await prisma.user.delete({
    where: {
      id: testUserId,
    },
  });


  await prisma.$disconnect();
});


test(
  "COMPLETED webhook completes payment and confirms pending order",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
      variant,
    } =
      await createTestPayment();


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
      );


    const result =
      await synchronizeCompletedPayPalWebhook(
        event,
      );


    assert.equal(
      result.status,
      PaymentStatus.COMPLETED,
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
      updatedPayment.providerPaymentId,
      event.resource.id,
    );

    assert.equal(
      updatedPayment.transactionReference,
      event.resource.id,
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


    const processed =
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      );


    assert.equal(
      processed,
      true,
    );


    const webhookEvent =
      await prisma.paymentWebhookEvent.findUniqueOrThrow({
        where: {
          provider_providerEventId: {
            provider:
              PaymentProvider.PAYPAL,

            providerEventId:
              event.id,
          },
        },
      });


    assert.equal(
      webhookEvent.paymentId,
      payment.id,
    );

    assert.equal(
      webhookEvent.eventType,
      "PAYMENT.CAPTURE.COMPLETED",
    );

    assert.ok(
      webhookEvent.processedAt,
    );
  },
);

test(
  "replaying the same COMPLETED webhook does not create another webhook event",
  async () => {
    const {
      payment,
      providerOrderId,
      variant,
    } =
      await createTestPayment();


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
      );


    await synchronizeCompletedPayPalWebhook(
      event,
    );


    await synchronizeCompletedPayPalWebhook(
      event,
    );


    const updatedPayment =
      await prisma.payment.findUniqueOrThrow({
        where: {
          id: payment.id,
        },
      });


    assert.equal(
      updatedPayment.status,
      PaymentStatus.COMPLETED,
    );


    const eventCount =
      await prisma.paymentWebhookEvent.count({
        where: {
          provider:
            PaymentProvider.PAYPAL,

          providerEventId:
            event.id,
        },
      });


    assert.equal(
      eventCount,
      1,
    );


    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            variant.id,
        },
      });


    /*
     * Replaying the exact COMPLETED webhook must not
     * finalize inventory a second time.
     */
    assert.equal(
      inventory.quantity,
      9,
    );
  },
);

test(
  "PENDING webhook keeps payment processing and leaves order pending",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.PENDING",
        providerOrderId,
      );


    await synchronizeNonSuccessPayPalWebhook(
      event,
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
      PaymentStatus.PROCESSING,
    );

    assert.equal(
      updatedOrder.status,
      OrderStatus.PENDING,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      ),
      true,
    );
  },
);


test(
  "DENIED webhook fails payment and leaves order pending",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.DENIED",
        providerOrderId,
      );


    await synchronizeNonSuccessPayPalWebhook(
      event,
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
      PaymentStatus.FAILED,
    );

    assert.equal(
      updatedOrder.status,
      OrderStatus.PENDING,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      ),
      true,
    );
  },
);


test(
  "delayed PENDING webhook does not regress a completed payment",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    const providerPaymentId =
      `PAYPAL-CAPTURE-${randomUUID()}`;


    const completedEvent =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
        providerPaymentId,
      );


    await synchronizeCompletedPayPalWebhook(
      completedEvent,
    );


    const pendingEvent =
      createCaptureEvent(
        "PAYMENT.CAPTURE.PENDING",
        providerOrderId,
        providerPaymentId,
      );


    await synchronizeNonSuccessPayPalWebhook(
      pendingEvent,
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
      updatedOrder.status,
      OrderStatus.CONFIRMED,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        pendingEvent.id,
      ),
      true,
    );
  },
);




test(
  "delayed DENIED webhook does not regress a completed payment",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    const providerPaymentId =
      `PAYPAL-CAPTURE-${randomUUID()}`;


    await synchronizeCompletedPayPalWebhook(
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
        providerPaymentId,
      ),
    );


    const deniedEvent =
      createCaptureEvent(
        "PAYMENT.CAPTURE.DENIED",
        providerOrderId,
        providerPaymentId,
      );


    await synchronizeNonSuccessPayPalWebhook(
      deniedEvent,
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
      updatedOrder.status,
      OrderStatus.CONFIRMED,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        deniedEvent.id,
      ),
      true,
    );
  },
);



test(
  "webhook with mismatched PayPal capture ID is rejected",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    await prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        providerPaymentId:
          "EXPECTED-CAPTURE-ID",

        transactionReference:
          "EXPECTED-CAPTURE-ID",
      },
    });


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
        "DIFFERENT-CAPTURE-ID",
      );


    await assert.rejects(
      () =>
        synchronizeCompletedPayPalWebhook(
          event,
        ),

      (error: unknown) => {
        assert.ok(
          error instanceof Error,
        );

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
          "PAYPAL_WEBHOOK_CAPTURE_MISMATCH",
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


    const unchangedOrder =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });


    assert.equal(
      unchangedPayment.status,
      PaymentStatus.PROCESSING,
    );

    assert.equal(
      unchangedPayment.providerPaymentId,
      "EXPECTED-CAPTURE-ID",
    );

    assert.equal(
      unchangedOrder.status,
      OrderStatus.PENDING,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      ),
      false,
    );
  },
);



test(
  "webhook for an unknown PayPal order is rejected",
  async () => {
    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        `UNKNOWN-ORDER-${randomUUID()}`,
      );


    await assert.rejects(
      () =>
        synchronizeCompletedPayPalWebhook(
          event,
        ),

      (error: unknown) => {
        assert.ok(
          error instanceof Error,
        );

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
          "PAYPAL_WEBHOOK_PAYMENT_NOT_FOUND",
        );

        return true;
      },
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      ),
      false,
    );
  },
);



test(
  "COMPLETED webhook preserves financial truth when order finalization conflicts",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
    } =
      await createTestPayment();


    await prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status:
          OrderStatus.CANCELLED,
      },
    });


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
      );


    await assert.rejects(
      () =>
        synchronizeCompletedPayPalWebhook(
          event,
        ),

      (error: unknown) => {
        assert.ok(
          error instanceof Error,
        );

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
          "ORDER_FINALIZATION_CONFLICT",
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


    const unchangedOrder =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },
      });


    /*
     * PayPal has already captured the money.
     *
     * Order finalization failure must therefore never erase
     * the financial truth.
     */
    assert.equal(
      unchangedPayment.status,
      PaymentStatus.COMPLETED,
    );

    assert.equal(
      unchangedPayment.providerPaymentId,
      event.resource.id,
    );

    assert.equal(
      unchangedPayment.transactionReference,
      event.resource.id,
    );

    assert.equal(
      unchangedOrder.status,
      OrderStatus.CANCELLED,
    );

    assert.equal(
      unchangedOrder.finalizedAt,
      null,
    );


    assert.equal(
      await isWebhookEventProcessed(
        PaymentProvider.PAYPAL,
        event.id,
      ),
      true,
    );


    const eventCount =
      await prisma.paymentWebhookEvent.count({
        where: {
          provider:
            PaymentProvider.PAYPAL,

          providerEventId:
            event.id,
        },
      });


    assert.equal(
      eventCount,
      1,
    );
  },
);



test(
  "concurrent delivery of the same COMPLETED webhook is handled idempotently",
  async () => {
    const {
      order,
      payment,
      providerOrderId,
      variant,
    } =
      await createTestPayment();


    const event =
      createCaptureEvent(
        "PAYMENT.CAPTURE.COMPLETED",
        providerOrderId,
      );


    const results =
      await Promise.allSettled([
        synchronizeCompletedPayPalWebhook(
          event,
        ),

        synchronizeCompletedPayPalWebhook(
          event,
        ),
      ]);


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


    const webhookEvents =
      await prisma.paymentWebhookEvent.findMany({
        where: {
          provider:
            PaymentProvider.PAYPAL,

          providerEventId:
            event.id,
        },
      });


    assert.equal(
      updatedPayment.status,
      PaymentStatus.COMPLETED,
    );

    assert.equal(
      updatedOrder.status,
      OrderStatus.CONFIRMED,
    );

    assert.ok(
      updatedOrder.finalizedAt,
    );


    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            variant.id,
        },
      });


    /*
     * Two concurrent deliveries of the same successful
     * PayPal event must converge on one Order finalization.
     */
    assert.equal(
      inventory.quantity,
      9,
    );

    assert.equal(
      webhookEvents.length,
      1,
    );


    /**
     * Both callers should eventually observe successful,
     * idempotent handling of the same provider event.
     */
    assert.equal(
      results[0].status,
      "fulfilled",
    );

    assert.equal(
      results[1].status,
      "fulfilled",
    );


    assert.ok(
      webhookEvents[0]?.processedAt,
    );
  },
);


test(
  "real PayPal refund webhook extracts capture ID from resource.links",
  () => {
    const captureId = "TEST-CAPTURE-123";
    const refundId = "TEST-REFUND-456";

    // Matches the structure received from the real Sandbox.
    const event = {
      id: `PAYPAL-EVENT-${randomUUID()}`,

      event_type: "PAYMENT.CAPTURE.REFUNDED",

      resource: {
        id: refundId,
        status: "COMPLETED",

        amount: {
          currency_code: "USD",
          value: "5.73",
        },

        links: [
          {
            href:
              `https://api.sandbox.paypal.com/v2/payments/refunds/${refundId}`,
            rel: "self",
            method: "GET",
          },
          {
            href:
              `https://api.sandbox.paypal.com/v2/payments/captures/${captureId}`,
            rel: "up",
            method: "GET",
          },
        ],
      },
    };

    const normalized =
      normalizePayPalRefundWebhook(event);

    const result =
      paypalRefundWebhookEventSchema.safeParse(
        normalized,
      );

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(
      result.data.resource.supplementary_data
        .related_ids.capture_id,
      captureId,
    );

    assert.equal(
      result.data.resource.id,
      refundId,
    );

    assert.equal(
      result.data.resource.amount.value,
      "5.73",
    );
  },
);

test(
  "refund normalization preserves an existing capture ID",
  () => {
    const event = {
      id: `PAYPAL-EVENT-${randomUUID()}`,

      event_type: "PAYMENT.CAPTURE.REFUNDED",

      resource: {
        id: "TEST-REFUND-789",
        status: "COMPLETED",

        amount: {
          currency_code: "USD",
          value: "2.00",
        },

        supplementary_data: {
          related_ids: {
            capture_id: "ORIGINAL-CAPTURE-ID",
          },
        },

        links: [
          {
            rel: "up",
            href:
              "https://api.sandbox.paypal.com/v2/payments/captures/DIFFERENT-CAPTURE-ID",
          },
        ],
      },
    };

    const normalized =
      normalizePayPalRefundWebhook(event);

    const result =
      paypalRefundWebhookEventSchema.safeParse(
        normalized,
      );

    assert.equal(result.success, true);

    if (!result.success) {
      return;
    }

    assert.equal(
      result.data.resource.supplementary_data
        .related_ids.capture_id,
      "ORIGINAL-CAPTURE-ID",
    );
  },
);

test(
  "refund normalization rejects an unrecognized capture URL",
  () => {
    const event = {
      id: `PAYPAL-EVENT-${randomUUID()}`,

      event_type: "PAYMENT.CAPTURE.REFUNDED",

      resource: {
        id: "TEST-REFUND-INVALID",
        status: "COMPLETED",

        amount: {
          currency_code: "USD",
          value: "1.00",
        },

        links: [
          {
            rel: "up",
            href:
              "https://example.com/v2/payments/captures/INVALID",
          },
        ],
      },
    };

    const normalized =
      normalizePayPalRefundWebhook(event);

    const result =
      paypalRefundWebhookEventSchema.safeParse(
        normalized,
      );

    // Missing a trusted capture ID must fail validation.
    assert.equal(result.success, false);
  },
);