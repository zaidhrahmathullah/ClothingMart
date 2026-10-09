import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import {
  getEffectivePrice,
  hasDiscount,
} from "../../lib/product-price.js";

type ProductQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true" | "false";
  sort:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "price_asc"
    | "price_desc";
};

export function formatProduct(product: any) {
  const variants = product.variants.map((variant: any) => {
    const effectivePrice =
      getEffectivePrice(variant);

    return {
      id: variant.id,
      sku: variant.sku,
      size: variant.size,
      color: variant.color,

      price: variant.price.toString(),

      discountedPrice:
        variant.discountedPrice?.toString() ?? null,

      effectivePrice:
        effectivePrice.toFixed(2),

      hasDiscount: hasDiscount(variant),

      stockQuantity:
        variant.inventory?.quantity ?? 0,

      inStock:
        (variant.inventory?.quantity ?? 0) > 0,
    };
  });

  const prices = variants.map(
    (variant: any) =>
      Number(variant.effectivePrice),
  );

  const minPrice = Math.min(...prices);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    isNew: product.isNew,
    createdAt: product.createdAt,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    images: product.images.map((image: any) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      sortOrder: image.sortOrder,
    })),
    variants,
    startingPrice: minPrice.toFixed(2),
    inStock: variants.some(
      (variant: any) => variant.inStock,
    ),
  };
}

export async function getProductFacets(category?: string) {
  const where: any = {
    isActive: true,
    product: {
      isActive: true,
      category: {
        isActive: true,
        OR: [
          { parentId: null },
          { parent: { isActive: true } },
        ],
      },
    },
  };

  if (category) {
    const selectedCategory = await prisma.category.findUnique({
      where: { slug: category },
      select: {
        id: true,
        parentId: true,
        isActive: true,
        parent: {
          select: { isActive: true },
        },
        children: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    if (
      !selectedCategory?.isActive ||
      (selectedCategory.parentId !== null &&
        !selectedCategory.parent?.isActive)
    ) {
      return { sizes: [], colors: [] };
    }

    const categoryIds =
      selectedCategory.parentId === null
        ? [
            selectedCategory.id,
            ...selectedCategory.children.map((child) => child.id),
          ]
        : [selectedCategory.id];

    where.product.categoryId = {
      in: categoryIds,
    };
  }

  const variants = await prisma.productVariant.findMany({
    where,
    select: {
      size: true,
      color: true,
    },
  });

  return {
    sizes: Array.from(
      new Set(variants.map((variant) => variant.size.trim())),
    )
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),

    colors: Array.from(
      new Set(variants.map((variant) => variant.color.trim())),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  };
}

export async function getProducts(query: ProductQuery) {
  const {
    page,
    limit,
    search,
    category,
    size,
    color,
    minPrice,
    maxPrice,
    inStock,
    sort,
  } = query;

  const where: any = {
    isActive: true,
    variants: {
      some: {
        isActive: true,
      },
    },
  };

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (category) {
    const selectedCategory = await prisma.category.findUnique({
      where: { slug: category },
      select: {
        id: true,
        parentId: true,
        isActive: true,
        parent: {
          select: {
            isActive: true,
          },
        },
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

    if (!selectedCategory?.isActive) {
      // An unknown or inactive category must return no products.
      where.categoryId = { in: [] };
    } else if (selectedCategory.parentId === null) {
      // Main category: include its own legacy products
      // and products from all active subcategories.
      where.categoryId = {
        in: [
          selectedCategory.id,
          ...selectedCategory.children.map((child) => child.id),
        ],
      };
    } else if (selectedCategory.parent?.isActive) {
      // Subcategory: include only its directly assigned products.
      where.categoryId = selectedCategory.id;
    } else {
      // A subcategory must not be publicly browsable
      // when its parent is inactive.
      where.categoryId = { in: [] };
    }
  }

  if (
    size ||
    color ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStock === "true"
  ) {
    where.variants = {
      some: {
        isActive: true,

        ...(size && {
          size: {
            equals: size,
            mode: "insensitive",
          },
        }),

        ...(color && {
          color: {
            equals: color,
            mode: "insensitive",
          },
        }),

        ...(minPrice !== undefined ||
        maxPrice !== undefined
          ? {
              OR: [
                {
                  discountedPrice: {
                    not: null,
                    ...(minPrice !== undefined && {
                      gte: minPrice,
                    }),
                    ...(maxPrice !== undefined && {
                      lte: maxPrice,
                    }),
                  },
                },
                {
                  discountedPrice: null,
                  price: {
                    ...(minPrice !== undefined && {
                      gte: minPrice,
                    }),
                    ...(maxPrice !== undefined && {
                      lte: maxPrice,
                    }),
                  },
                },
              ],
            }
          : {}),

        ...(inStock === "true" && {
          inventory: {
            is: {
              quantity: { gt: 0 },
            },
          },
        }),
      },
    };
  }

  
  const productInclude = {
    category: true,
    images: {
      orderBy: {
        sortOrder: "asc" as const,
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
  };

  const skip = (page - 1) * limit;

  let products: any;
  let total: number;

  if (sort === "price_asc" || sort === "price_desc") {
    /*
     * Price is stored in ProductVariant.
     *
     * Aggregate the minimum ACTIVE variant price per product.
     * This must use the same pricing definition as formatProduct().
     *
     * Importantly, size/color/price search filters determine which
     * products qualify, but startingPrice still considers all of
     * each qualifying product's active variants.
     */

    const priceVariants =
      await prisma.productVariant.findMany({
        where: {
          isActive: true,
          product: {
            is: where,
          },
        },

        select: {
          productId: true,
          price: true,
          discountedPrice: true,
        },
      });

    const minimumPrices = new Map<string, number>();

    for (const variant of priceVariants) {
      const effectivePrice =
        getEffectivePrice(variant);

      const current =
        minimumPrices.get(variant.productId);

      if (
        current === undefined ||
        effectivePrice < current
      ) {
        minimumPrices.set(
          variant.productId,
          effectivePrice,
        );
      }
    }

    const sortedGroups = Array.from(
      minimumPrices.entries(),
    )
      .map(([productId, price]) => ({
        productId,
        price,
      }))
      .sort((a, b) => {
        const difference =
          sort === "price_asc"
            ? a.price - b.price
            : b.price - a.price;

        return (
          difference ||
          a.productId.localeCompare(b.productId)
        );
      });

    total = sortedGroups.length;

    const pageIds = sortedGroups
      .slice(skip, skip + limit)
      .map((group) => group.productId);


    if (pageIds.length === 0) {
      products = [];
    } else {
      const fetchedProducts = await prisma.product.findMany({
        where: {
          id: {
            in: pageIds,
          },
        },

        include: productInclude,
      });

      // SQL IN does not guarantee the requested ID ordering.
      const productMap = new Map(
        fetchedProducts.map((product) => [
          product.id,
          product,
        ]),
      );

      products = pageIds
        .map((id) => productMap.get(id))
        .filter(
          (product): product is NonNullable<typeof product> =>
            product !== undefined,
        );
    }
  } else {
    /*
     * Date and name sorting can be performed directly by Prisma.
     * Only the requested page is retrieved from PostgreSQL.
     */

    const orderBy =
      sort === "oldest"
        ? [
            { createdAt: "asc" as const },
            { id: "asc" as const },
          ]
        : sort === "name_asc"
          ? [
              { name: "asc" as const },
              { id: "asc" as const },
            ]
          : sort === "name_desc"
            ? [
                { name: "desc" as const },
                { id: "asc" as const },
              ]
            : [
                { createdAt: "desc" as const },
                { id: "asc" as const },
              ];

    const [count, pageProducts] = await prisma.$transaction([
      prisma.product.count({
        where,
      }),

      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    total = count;
    products = pageProducts;
  }

  const totalPages = Math.ceil(total / limit);

  return {
    products: products.map(formatProduct),

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  };
}


export async function getProductBySlug(
  slug: string,
) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
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
  });

  if (!product) {
    throw new AppError(
      404,
      "PRODUCT_NOT_FOUND",
      "Product not found",
    );
  }

  return formatProduct(product);
}