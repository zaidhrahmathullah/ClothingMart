import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

export async function getProductReviews(
  productId: string,
) {
  const reviews =
    await prisma.review.findMany({
      where: {
        productId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  const summary =
    await prisma.review.aggregate({
      where: {
        productId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

  return {
    reviews,
    averageRating:
      summary._avg.rating ?? 0,
    reviewCount:
      summary._count.id,
  };
}

async function verifyPurchase(
  userId: string,
  productId: string,
) {
  const purchase =
    await prisma.orderItem.findFirst({
      where: {
        variant: {
          productId,
        },
        order: {
          userId,
          status: {
            in: [
              "CONFIRMED",
              "PROCESSING",
              "SHIPPED",
              "DELIVERED",
            ],
          },
        },
      },
    });

  return Boolean(purchase);
}

export async function createReview(
  userId: string,
  productId: string,
  rating: number,
  comment: string,
) {
  const product =
    await prisma.product.findFirst({
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

  const purchased =
    await verifyPurchase(
      userId,
      productId,
    );

  if (!purchased) {
    throw new AppError(
      403,
      "PRODUCT_NOT_PURCHASED",
      "You can only review products you have purchased",
    );
  }

  return prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
    },
  });
}