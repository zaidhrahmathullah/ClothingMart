import {
  OrderStatus,
} from "../../generated/prisma/client.js";

import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Finalize the inventory and cart effects of a successfully
 * paid Order.
 *
 * This operation is idempotent:
 * once Order.finalizedAt is set, repeated calls are a no-op.
 *
 * IMPORTANT:
 * The Payment must already have been persisted as COMPLETED
 * before this function is called.
 */
export async function finalizePaidOrder(
  orderId: string,
) {
  return prisma.$transaction(async (tx) => {
    /*
     * Load the Order snapshot that will drive finalization.
     *
     * Inventory/cart changes are based on OrderItems rather
     * than the customer's current cart contents.
     */
    const order = await tx.order.findUnique({
      where: {
        id: orderId,
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
        "Order not found while finalizing payment",
      );
    }

    /*
     * A paid Order must have a persisted COMPLETED payment
     * before inventory/cart finalization is allowed.
     */
    const completedPayment =
      order.payment.some(
        (payment) =>
          payment.status === "COMPLETED",
      );

    if (!completedPayment) {
      throw new AppError(
        409,
        "ORDER_PAYMENT_NOT_COMPLETED",
        "Order cannot be finalized before payment is completed",
      );
    }

    if (order.items.length === 0) {
        throw new AppError(
            409,
            "ORDER_HAS_NO_ITEMS",
            "A paid order with no order items cannot be finalized",
        );
    }

    if (order.status === OrderStatus.CANCELLED) {
        throw new AppError(
            409,
            "ORDER_FINALIZATION_CONFLICT",
            "A cancelled order cannot be finalized",
        );
    }

    /*
     * Already finalized means this logical operation has
     * previously succeeded.
     *
     * Repeated capture/webhook processing must therefore
     * become a safe no-op.
     */
    if (order.finalizedAt) {
      return {
        orderId: order.id,
        status: order.status,
        finalizedAt: order.finalizedAt,
        alreadyFinalized: true,
      };
    }

    /*
     * Claim finalization.
     *
     * The conditional update is our exactly-once gate.
     * Concurrent finalizers for the same Order cannot both
     * successfully claim finalizedAt = null.
     *
     * Because this happens inside the same transaction as
     * inventory/cart mutation, any later failure rolls the
     * claim back as well.
     */
    const finalizedAt = new Date();

    const claim =
      await tx.order.updateMany({
        where: {
          id: order.id,
          finalizedAt: null,
        },

        data: {
          finalizedAt,
        },
      });

    if (claim.count !== 1) {
      /*
       * Another transaction may have finalized the Order
       * while this request was waiting for the row.
       */
      const currentOrder =
        await tx.order.findUnique({
          where: {
            id: order.id,
          },

          select: {
            id: true,
            status: true,
            finalizedAt: true,
          },
        });

      if (currentOrder?.finalizedAt) {
        return {
          orderId: currentOrder.id,
          status: currentOrder.status,
          finalizedAt:
            currentOrder.finalizedAt,
          alreadyFinalized: true,
        };
      }

      throw new AppError(
        409,
        "ORDER_FINALIZATION_STATE_CHANGED",
        "Order finalization state changed while processing the payment",
      );
    }

    /*
     * Deduct inventory using the immutable OrderItem
     * quantities.
     *
     * quantity >= requested quantity remains part of the
     * UPDATE itself so stock can never be driven negative.
     */
    for (const item of order.items) {
      const inventoryUpdate =
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

      if (inventoryUpdate.count !== 1) {
        throw new AppError(
          409,
          "PAID_ORDER_INSUFFICIENT_STOCK",
          `Insufficient stock to finalize paid order item "${item.productName}"`,
        );
      }
    }

    /*
     * Find the customer's current Cart.
     *
     * The Cart may have changed while PayPal was open, so
     * we never blindly clear it.
     */
    const cart = await tx.cart.findUnique({
      where: {
        userId: order.userId,
      },

      select: {
        id: true,
      },
    });

    if (cart) {
      for (const item of order.items) {
        /*
         * If the current cart contains MORE than the ordered
         * quantity, subtract only the purchased quantity.
         *
         * Example:
         * ordered 2, current cart 3 -> leave 1.
         */
        const decrement =
          await tx.cartItem.updateMany({
            where: {
              cartId: cart.id,
              productVariantId:
                item.productVariantId,

              quantity: {
                gt: item.quantity,
              },
            },

            data: {
              quantity: {
                decrement:
                  item.quantity,
              },
            },
          });

        if (decrement.count === 1) {
          continue;
        }

        /*
         * If the item is unchanged, reduced, or otherwise
         * contains no more than the purchased quantity,
         * remove what remains.
         *
         * If it is already absent this is naturally a no-op.
         */
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            productVariantId:
              item.productVariantId,

            quantity: {
              lte: item.quantity,
            },
          },
        });
      }
    }

    /*
     * Inventory/cart finalization succeeded.
     *
     * Only now may a still-PENDING Order become CONFIRMED.
     * Never move an Order backwards if it has legitimately
     * progressed further.
     */
    const currentOrder =
      await tx.order.findUniqueOrThrow({
        where: {
          id: order.id,
        },

        select: {
          status: true,
        },
      });



    if (
      currentOrder.status ===
      OrderStatus.PENDING
    ) {
      await tx.order.update({
        where: {
          id: order.id,
        },

        data: {
          status:
            OrderStatus.CONFIRMED,
        },
      });
    }

    return {
      orderId: order.id,
      status:
        currentOrder.status ===
        OrderStatus.PENDING
          ? OrderStatus.CONFIRMED
          : currentOrder.status,
      finalizedAt,
      alreadyFinalized: false,
    };
  });
}