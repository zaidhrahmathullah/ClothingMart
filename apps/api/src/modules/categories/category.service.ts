import { prisma } from "../../lib/prisma.js";

export async function getCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getCategoryProducts(slug: string) {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
  });

  if (!category) {
    return null;
  }

  const products = await prisma.product.findMany({
    where: {
      categoryId: category.id,
      isActive: true,
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return products.map((product) => ({
    ...product,
    inStock: product.variants.some(
      (variant) => (variant.inventory?.quantity ?? 0) > 0,
    ),
  }));
}