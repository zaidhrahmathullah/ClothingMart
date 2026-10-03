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
  finalizePaidOrder,
} from "./order-finalization.service.js";

const testRunId = randomUUID();

const testUserEmail =
  `order-finalization-${testRunId}@example.com`;

let testUserId: string;
let testProductId: string;
let testCategoryId: string;

type FinalizationFixtureOptions = {
  paymentStatus?: PaymentStatus;
  orderStatus?: OrderStatus;
  stock?: number;
  orderedQuantity?: number;
  cartQuantity?: number | null;
};

async function createFixture(
  options: FinalizationFixtureOptions = {},
) {
  const paymentStatus =
    options.paymentStatus ??
    PaymentStatus.COMPLETED;

  const orderStatus =
    options.orderStatus ??
    OrderStatus.PENDING;

  const stock =
    options.stock ?? 10;

  const orderedQuantity =
    options.orderedQuantity ?? 2;

  const cartQuantity =
    options.cartQuantity === undefined
      ? orderedQuantity
      : options.cartQuantity;

  const variant =
    await prisma.productVariant.create({
        data: {
        productId: testProductId,

        sku:
            `FINALIZE-${randomUUID()}`,

        size: "TEST",

        color: "Test Color",

        price: "1000.00",

        inventory: {
            create: {
            quantity: stock,
            },
        },
        },

        include: {
        inventory: true,
        },
    });

  const order =
    await prisma.order.create({
      data: {
        userId: testUserId,

        status: orderStatus,

        subtotal:
          (
            1000 * orderedQuantity
          ).toFixed(2),

        shippingFee: "250.00",

        total:
          (
            1000 * orderedQuantity +
            250
          ).toFixed(2),

        shippingFullName:
          "Order Finalization Test User",

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
              "Finalization Test Product",

            variantDescription:
              "Finalization Test Variant",

            unitPrice:
              "1000.00",

            quantity:
              orderedQuantity,

            subtotal:
              (
                1000 *
                orderedQuantity
              ).toFixed(2),
          },
        },

        payment: {
          create: {
            provider:
              PaymentProvider.PAYPAL,

            status:
              paymentStatus,

            amount:
              (
                1000 *
                  orderedQuantity +
                250
              ).toFixed(2),

            currency: "LKR",

            providerOrderId:
              `PAYPAL-ORDER-${randomUUID()}`,

            providerPaymentId:
              paymentStatus ===
              PaymentStatus.COMPLETED
                ? `PAYPAL-CAPTURE-${randomUUID()}`
                : null,
          },
        },
      },
    });

  const cart =
    await prisma.cart.upsert({
      where: {
        userId: testUserId,
      },

      create: {
        userId: testUserId,
      },

      update: {},
    });

  /*
   * Each fixture uses a unique ProductVariant, so existing
   * CartItems from another fixture cannot conflict.
   */
  if (
    cartQuantity !== null &&
    cartQuantity > 0
  ) {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,

        productVariantId:
          variant.id,

        quantity:
          cartQuantity,
      },
    });
  }

  return {
    order,
    variant,
    cart,
    stock,
    orderedQuantity,
    cartQuantity,
  };
}

before(async () => {
  const user =
    await prisma.user.create({
      data: {
        name:
          "Order Finalization Test User",

        email: testUserEmail,

        passwordHash:
          "order-finalization-test-only",

        role: "CUSTOMER",
      },
    });

  testUserId = user.id;

  const category =
    await prisma.category.create({
      data: {
        name:
          `Finalization Category ${testRunId}`,

        slug:
          `finalization-category-${testRunId}`,
      },
    });

  testCategoryId = category.id;

  const product =
    await prisma.product.create({
      data: {
        name:
          "Finalization Test Product",

        slug:
          `finalization-product-${testRunId}`,

        description:
          "Test product",

        categoryId:
          testCategoryId,

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

  await prisma.cart.deleteMany({
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
  "completed payment finalizes inventory, cart, and order exactly once",
  async () => {
    const fixture =
      await createFixture({
        stock: 10,
        orderedQuantity: 2,
        cartQuantity: 2,
      });

    const first =
      await finalizePaidOrder(
        fixture.order.id,
      );

    assert.equal(
      first.alreadyFinalized,
      false,
    );

    const inventoryAfterFirst =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventoryAfterFirst.quantity,
      8,
    );

    const cartItemAfterFirst =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: fixture.cart.id,
            productVariantId:
              fixture.variant.id,
          },
        },
      });

    assert.equal(
      cartItemAfterFirst,
      null,
    );

    const orderAfterFirst =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: fixture.order.id,
        },
      });

    assert.equal(
      orderAfterFirst.status,
      OrderStatus.CONFIRMED,
    );

    assert.ok(
      orderAfterFirst.finalizedAt,
    );

    const second =
      await finalizePaidOrder(
        fixture.order.id,
      );

    assert.equal(
      second.alreadyFinalized,
      true,
    );

    const inventoryAfterSecond =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventoryAfterSecond.quantity,
      8,
    );
  },
);

test(
  "cart quantity greater than ordered quantity preserves the extra quantity",
  async () => {
    const fixture =
      await createFixture({
        orderedQuantity: 2,
        cartQuantity: 5,
      });

    await finalizePaidOrder(
      fixture.order.id,
    );

    const cartItem =
      await prisma.cartItem.findUniqueOrThrow({
        where: {
          cartId_productVariantId: {
            cartId: fixture.cart.id,
            productVariantId:
              fixture.variant.id,
          },
        },
      });

    assert.equal(
      cartItem.quantity,
      3,
    );
  },
);

test(
  "cart quantity lower than ordered quantity removes the remaining cart item",
  async () => {
    const fixture =
      await createFixture({
        orderedQuantity: 3,
        cartQuantity: 1,
      });

    await finalizePaidOrder(
      fixture.order.id,
    );

    const cartItem =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: fixture.cart.id,
            productVariantId:
              fixture.variant.id,
          },
        },
      });

    assert.equal(
      cartItem,
      null,
    );
  },
);

test(
  "missing cart item does not prevent successful finalization",
  async () => {
    const fixture =
      await createFixture({
        orderedQuantity: 2,
        cartQuantity: null,
      });

    await finalizePaidOrder(
      fixture.order.id,
    );

    const order =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: fixture.order.id,
        },
      });

    assert.equal(
      order.status,
      OrderStatus.CONFIRMED,
    );

    assert.ok(order.finalizedAt);
  },
);

test(
  "insufficient stock rolls back the entire finalization transaction",
  async () => {
    const fixture =
      await createFixture({
        stock: 1,
        orderedQuantity: 2,
        cartQuantity: 2,
      });

    await assert.rejects(
      () =>
        finalizePaidOrder(
          fixture.order.id,
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
          "PAID_ORDER_INSUFFICIENT_STOCK",
        );

        return true;
      },
    );

    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventory.quantity,
      1,
    );

    const cartItem =
      await prisma.cartItem.findUniqueOrThrow({
        where: {
          cartId_productVariantId: {
            cartId: fixture.cart.id,
            productVariantId:
              fixture.variant.id,
          },
        },
      });

    assert.equal(
      cartItem.quantity,
      2,
    );

    const order =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: fixture.order.id,
        },
      });

    assert.equal(
      order.status,
      OrderStatus.PENDING,
    );

    assert.equal(
      order.finalizedAt,
      null,
    );

    const payment =
      await prisma.payment.findFirstOrThrow({
        where: {
          orderId:
            fixture.order.id,
        },
      });

    assert.equal(
      payment.status,
      PaymentStatus.COMPLETED,
    );
  },
);

test(
  "order without a completed payment cannot be finalized",
  async () => {
    const fixture =
      await createFixture({
        paymentStatus:
          PaymentStatus.PROCESSING,
      });

    await assert.rejects(
      () =>
        finalizePaidOrder(
          fixture.order.id,
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
          "ORDER_PAYMENT_NOT_COMPLETED",
        );

        return true;
      },
    );

    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventory.quantity,
      fixture.stock,
    );
  },
);

test(
  "cancelled order cannot be finalized even when payment is completed",
  async () => {
    const fixture =
      await createFixture({
        orderStatus:
          OrderStatus.CANCELLED,

        paymentStatus:
          PaymentStatus.COMPLETED,
      });

    await assert.rejects(
      () =>
        finalizePaidOrder(
          fixture.order.id,
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

    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventory.quantity,
      fixture.stock,
    );

    const order =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: fixture.order.id,
        },
      });

    assert.equal(
      order.finalizedAt,
      null,
    );
  },
);

test(
  "concurrent finalizers deduct inventory and finalize cart only once",
  async () => {
    const fixture =
      await createFixture({
        stock: 10,
        orderedQuantity: 2,
        cartQuantity: 2,
      });

    const results =
      await Promise.allSettled([
        finalizePaidOrder(
          fixture.order.id,
        ),

        finalizePaidOrder(
          fixture.order.id,
        ),
      ]);

    const fulfilled =
      results.filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<
            ReturnType<
              typeof finalizePaidOrder
            >
          >
        > =>
          result.status ===
          "fulfilled",
      );

    /*
     * At least one request must perform finalization.
     *
     * Depending on transaction timing/isolation, the second
     * caller may either observe the completed finalization
     * or lose the claim race safely.
     */
    assert.ok(
      fulfilled.length >= 1,
    );

    for (const result of results) {
      if (
        result.status ===
        "rejected"
      ) {
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
          "ORDER_FINALIZATION_STATE_CHANGED",
        );
      }
    }

    const inventory =
      await prisma.inventory.findUniqueOrThrow({
        where: {
          variantId:
            fixture.variant.id,
        },
      });

    assert.equal(
      inventory.quantity,
      8,
    );

    const cartItem =
      await prisma.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: fixture.cart.id,
            productVariantId:
              fixture.variant.id,
          },
        },
      });

    assert.equal(
      cartItem,
      null,
    );

    const order =
      await prisma.order.findUniqueOrThrow({
        where: {
          id: fixture.order.id,
        },
      });

    assert.equal(
      order.status,
      OrderStatus.CONFIRMED,
    );

    assert.ok(
      order.finalizedAt,
    );
  },
);