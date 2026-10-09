import { prisma } from "../../lib/prisma.js";
import { formatProduct } from "../products/products.service.js";

export async function getCategories() {
  return prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },

    include: {
      children: {
        where: {
          isActive: true,
        },

        select: {
          id: true,
          parentId: true,
          name: true,
          slug: true,
          description: true,
          cardImageUrl: true,
          animationImageUrl: true,
          bannerImageUrl: true,
          isActive: true,
        },

        orderBy: {
          name: "asc",
        },
      },
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

      // A subcategory must not be publicly accessible
      // when its parent is inactive.
      OR: [
        { parentId: null },
        {
          parent: {
            isActive: true,
          },
        },
      ],
    },

    select: {
      id: true,
      parentId: true,

      children: {
        where: {
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  // A parent category includes products directly assigned
  // to itself and products from its active subcategories.
  //
  // A subcategory includes only its own products.
  const categoryIds =
    category.parentId === null
      ? [
          category.id,
          ...category.children.map((child) => child.id),
        ]
      : [category.id];

  const products = await prisma.product.findMany({
    where: {
      categoryId: {
        in: categoryIds,
      },
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

  return products.map(formatProduct);
}