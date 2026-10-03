import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

export async function createOrder(
  userId: string,
  addressId: string,
) {
  return prisma.$transaction(async (tx) => {
    /*
     * 1. Verify address ownership
     */
    const address = await tx.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!address) {
      throw new AppError(
        404,
        "ADDRESS_NOT_FOUND",
        "Shipping address not found",
      );
    }

    /*
     * 2. Load cart
     */
    const cart = await tx.cart.findUnique({
      where: {
        userId,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            variant: {
              include: {
                inventory: true,
                product: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError(
        400,
        "EMPTY_CART",
        "Your cart is empty",
      );
    }

    /*
     * 3. Validate every cart item
     *    and calculate totals on the server.
     */
    let subtotal = 0;

    const orderItems = [];

    for (const item of cart.items) {
      const variant = item.variant;

      if (
        !variant.isActive ||
        !variant.product.isActive
      ) {
        throw new AppError(
          400,
          "PRODUCT_UNAVAILABLE",
          `${variant.product.name} is no longer available`,
        );
      }

      const availableStock =
        variant.inventory?.quantity ?? 0;

      if (availableStock < item.quantity) {
        throw new AppError(
          400,
          "INSUFFICIENT_STOCK",
          `${variant.product.name} has only ${availableStock} item(s) available`,
        );
      }

      const unitPrice = Number(variant.price);

      const itemSubtotal =
        unitPrice * item.quantity;

      subtotal += itemSubtotal;

      orderItems.push({
        productVariantId: variant.id,
        productName: variant.product.name,
        variantDescription:
          `${variant.color} / ${variant.size}`,
        unitPrice: variant.price,
        quantity: item.quantity,
        subtotal: itemSubtotal.toFixed(2),
      });
    }

    /*
     * Shipping is currently free.
     *
     * Later this can be replaced by:
     * - location based shipping
     * - delivery method
     * - courier calculation
     */
    const shippingFee = 0;

    const total =
      subtotal + shippingFee;

    /*
     * 4. Create order
     */
    const order = await tx.order.create({
      data: {
        userId,

        status: "PENDING",

        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        total: total.toFixed(2),

        shippingFullName:
          address.fullName,

        shippingPhone:
          address.phone,

        shippingAddressLine1:
          address.addressLine1,

        shippingAddressLine2:
          address.addressLine2,

        shippingCity:
          address.city,

        shippingDistrict:
          address.district,

        shippingPostalCode:
          address.postalCode,

        shippingCountry:
          address.country,

        addressId: address.id,

        items: {
          create: orderItems.map(
            (item) => ({
              productVariantId:
                item.productVariantId,

              productName:
                item.productName,

              variantDescription:
                item.variantDescription,

              unitPrice:
                item.unitPrice,

              quantity:
                item.quantity,

              subtotal:
                item.subtotal,
            }),
          ),
        },

        payment: {
          create: {
            provider: "PAYPAL",
            status: "PENDING",
            amount: total.toFixed(2),
          },
        },
      },

      include: {
        items: true,

        payment: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    /*
     * 5. Return the created order
     */
    return formatOrder(order);
  });
}

/*
 * Select the Payment that best represents the
 * current payment state of an Order.
 *
 * An Order can contain multiple Payment records,
 * so callers must not assume payment[0] is always
 * the relevant Payment.
 *
 * Payments are loaded newest-first. Within that
 * ordering, lifecycle relevance determines which
 * Payment should be exposed by the Order API.
 */
function selectRelevantPayment(
  payments: any[],
) {
  if (
    !payments ||
    payments.length === 0
  ) {
    return null;
  }

  const priority = [
    "COMPLETED",
    "PROCESSING",
    "PENDING",
    "PARTIALLY_REFUNDED",
    "REFUNDED",
    "FAILED",
    "CANCELLED",
  ];

  for (const status of priority) {
    const payment = payments.find(
      (item) =>
        item.status === status,
    );

    if (payment) {
      return payment;
    }
  }

  return payments[0] ?? null;
}

function formatOrder(order: any) {
  /*
   * Order.payment is a Payment[] relation.
   *
   * Select the relevant Payment explicitly instead
   * of treating the relation as a single object.
   */
  const payment =
    selectRelevantPayment(order.payment);

  return {
    id: order.id,
    status: order.status,

    subtotal:
      Number(order.subtotal).toFixed(2),

    shippingFee:
      Number(order.shippingFee).toFixed(2),

    total:
      Number(order.total).toFixed(2),

    shippingAddress: {
      fullName:
        order.shippingFullName,

      phone:
        order.shippingPhone,

      addressLine1:
        order.shippingAddressLine1,

      addressLine2:
        order.shippingAddressLine2,

      city:
        order.shippingCity,

      district:
        order.shippingDistrict,

      postalCode:
        order.shippingPostalCode,

      country:
        order.shippingCountry,
    },

    items: order.items.map(
      (item: any) => ({
        id: item.id,

        productVariantId:
          item.productVariantId,

        productName:
          item.productName,

        variantDescription:
          item.variantDescription,

        unitPrice:
          Number(
            item.unitPrice,
          ).toFixed(2),

        quantity:
          item.quantity,

        subtotal:
          Number(
            item.subtotal,
          ).toFixed(2),
      }),
    ),

    payment: payment
      ? {
          id: payment.id,

          provider:
            payment.provider,

          status:
            payment.status,

          amount:
            Number(
              payment.amount,
            ).toFixed(2),

          currency:
            payment.currency,

          providerOrderId:
            payment.providerOrderId,

          providerPaymentId:
            payment.providerPaymentId,

          transactionReference:
            payment.transactionReference,

          createdAt:
            payment.createdAt,

          updatedAt:
            payment.updatedAt,
        }
      : null,

    createdAt:
      order.createdAt,
  };
}

export async function getUserOrders(
  userId: string,
) {
  const orders =
    await prisma.order.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        items: true,

        /*
         * Payment is a one-to-many relation.
         * Always load newest attempts first.
         */
        payment: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  return orders.map(formatOrder);
}

export async function getUserOrder(
  userId: string,
  orderId: string,
) {
  const order =
    await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: {
        items: true,

        /*
         * Payment is a one-to-many relation.
         * Always load newest attempts first.
         */
        payment: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

  if (!order) {
    throw new AppError(
      404,
      "ORDER_NOT_FOUND",
      "Order not found",
    );
  }

  return formatOrder(order);
}