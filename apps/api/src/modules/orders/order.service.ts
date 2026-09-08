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
            provider: "PENDING",
            status: "PENDING",
            amount: total.toFixed(2),
          },
        },
      },

      include: {
        items: true,
        payment: true,
      },
    });

    /*
     * 5. Decrease inventory.
     *
     * IMPORTANT:
     *
     * We use:
     *
     * quantity >= requestedQuantity
     *
     * inside the WHERE condition.
     *
     * This protects against two customers
     * attempting to purchase the final items
     * at approximately the same time.
     */
    for (const item of cart.items) {
      const result =
        await tx.inventory.updateMany({
          where: {
            variantId:
              item.productVariantId,

            quantity: {
              gte: item.quantity,
            },
          },

          data: {
            quantity: {
              decrement:
                item.quantity,
            },
          },
        });

      if (result.count !== 1) {
        throw new AppError(
          409,
          "STOCK_CHANGED",
          "Stock changed while placing your order. Please review your cart and try again.",
        );
      }
    }

    /*
     * 6. Clear cart
     */
    await tx.cartItem.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    /*
     * 7. Return the created order
     */
    return formatOrder(order);
  });
}

function formatOrder(order: any) {
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
          Number(item.unitPrice).toFixed(2),

        quantity:
          item.quantity,

        subtotal:
          Number(item.subtotal).toFixed(2),
      }),
    ),

    payment: order.payment
      ? {
          id: order.payment.id,
          provider:
            order.payment.provider,
          status:
            order.payment.status,
          amount:
            Number(order.payment.amount).toFixed(2),
          transactionReference:
            order.payment
              .transactionReference,
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
        payment: true,
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
        payment: true,
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