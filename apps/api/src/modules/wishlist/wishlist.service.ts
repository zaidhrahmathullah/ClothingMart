import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import { formatProduct } from "../products/products.service.js";

async function getOrCreateWishlist(userId: string) {
  let wishlist = await prisma.wishlist.findUnique({
    where: {
      userId,
    },
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: {
        userId,
      },
    });
  }

  return wishlist;
}

export async function getWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: {
      wishlist: {
        userId,
      },
      product: {
        isActive: true,
      },
    },
    include: {
      product: {
        include: {
          category: true,
          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            include: {
              inventory: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items.map((item) => formatProduct(item.product));
}

export async function getWishlistIds(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: {
      wishlist: {
        userId,
      },
    },
    select: {
      productId: true,
    },
  });

  return items.map((item) => item.productId);
}

export async function addWishlistItem(
  userId: string,
  productId: string,
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      isActive: true,
    },
  });

  if (!product) {
    throw new AppError(
      404,
      "PRODUCT_NOT_FOUND",
      "Product not found",
    );
  }

  const wishlist = await getOrCreateWishlist(userId);

  return prisma.wishlistItem.upsert({
    where: {
      wishlistId_productId: {
        wishlistId: wishlist.id,
        productId,
      },
    },
    create: {
      wishlistId: wishlist.id,
      productId,
    },
    update: {},
  });
}

export async function removeWishlistItem(
  userId: string,
  productId: string,
) {
  const wishlist = await prisma.wishlist.findUnique({
    where: {
      userId,
    },
  });

  if (!wishlist) {
    return;
  }

  await prisma.wishlistItem.deleteMany({
    where: {
      wishlistId: wishlist.id,
      productId,
    },
  });
}
