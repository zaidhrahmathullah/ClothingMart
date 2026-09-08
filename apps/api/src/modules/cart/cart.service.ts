import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

function formatCart(cart: any) {
  const items = cart.items.map((item: any) => {
    const unitPrice = Number(item.variant.price);
    const subtotal = unitPrice * item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      unitPrice: unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),

      variant: {
        id: item.variant.id,
        sku: item.variant.sku,
        size: item.variant.size,
        color: item.variant.color,
        price: unitPrice.toFixed(2),
        stockQuantity: item.variant.inventory?.quantity ?? 0,
        inStock: (item.variant.inventory?.quantity ?? 0) > 0,
      },

      product: {
        id: item.variant.product.id,
        name: item.variant.product.name,
        slug: item.variant.product.slug,
        imageUrl:
          item.variant.product.images[0]?.imageUrl ?? null,
      },
    };
  });

  const subtotal = items.reduce(
    (sum: number, item: any) =>
      sum + Number(item.subtotal),
    0,
  );

  return {
    id: cart.id,

    items,

    itemCount: items.reduce(
      (sum: number, item: any) =>
        sum + item.quantity,
      0,
    ),

    subtotal: subtotal.toFixed(2),
  };
}

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: {
      userId,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId,
      },
    });
  }

  return cart;
}

export async function getCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  const cartWithItems =
    await prisma.cart.findUnique({
      where: {
        id: cart.id,
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

                product: {
                  include: {
                    images: {
                      orderBy: {
                        sortOrder: "asc",
                      },

                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!cartWithItems) {
    throw new AppError(
      404,
      "CART_NOT_FOUND",
      "Cart not found",
    );
  }

  return formatCart(cartWithItems);
}

export async function addItemToCart(
  userId: string,
  variantId: string,
  quantity: number,
) {
  const cart = await getOrCreateCart(userId);

  const variant =
    await prisma.productVariant.findUnique({
      where: {
        id: variantId,
      },

      include: {
        inventory: true,
        product: true,
      },
    });

  if (
    !variant ||
    !variant.isActive ||
    !variant.product.isActive
  ) {
    throw new AppError(
      404,
      "VARIANT_NOT_FOUND",
      "Product variant not found",
    );
  }

  const availableStock =
    variant.inventory?.quantity ?? 0;

  if (availableStock < quantity) {
    throw new AppError(
      400,
      "INSUFFICIENT_STOCK",
      `Only ${availableStock} item(s) are available`,
    );
  }

  const existingItem =
    await prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId: cart.id,
          productVariantId: variantId,
        },
      },
    });

  if (existingItem) {
    const newQuantity =
      existingItem.quantity + quantity;

    if (newQuantity > availableStock) {
      throw new AppError(
        400,
        "INSUFFICIENT_STOCK",
        `Only ${availableStock} item(s) are available`,
      );
    }

    await prisma.cartItem.update({
      where: {
        id: existingItem.id,
      },

      data: {
        quantity: newQuantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productVariantId: variantId,
        quantity,
      },
    });
  }

  return getCart(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
) {
  const cart = await getOrCreateCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },

    include: {
      variant: {
        include: {
          inventory: true,
        },
      },
    },
  });

  if (!item) {
    throw new AppError(
      404,
      "CART_ITEM_NOT_FOUND",
      "Cart item not found",
    );
  }

  const availableStock =
    item.variant.inventory?.quantity ?? 0;

  if (quantity > availableStock) {
    throw new AppError(
      400,
      "INSUFFICIENT_STOCK",
      `Only ${availableStock} item(s) are available`,
    );
  }

  await prisma.cartItem.update({
    where: {
      id: item.id,
    },

    data: {
      quantity,
    },
  });

  return getCart(userId);
}

export async function removeCartItem(
  userId: string,
  itemId: string,
) {
  const cart = await getOrCreateCart(userId);

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (!item) {
    throw new AppError(
      404,
      "CART_ITEM_NOT_FOUND",
      "Cart item not found",
    );
  }

  await prisma.cartItem.delete({
    where: {
      id: item.id,
    },
  });

  return getCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await getOrCreateCart(userId);

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
    },
  });

  return getCart(userId);
}