import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";

type ProductQuery = {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  sort:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "price_asc"
    | "price_desc";
};

export function formatProduct(product: any) {
  const variants = product.variants.map((variant: any) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    price: variant.price.toString(),
    stockQuantity: variant.inventory?.quantity ?? 0,
    inStock: (variant.inventory?.quantity ?? 0) > 0,
  }));

  const prices = variants.map((variant: any) =>
    Number(variant.price),
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
    sort,
  } = query;

  const where: any = {
    isActive: true,
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
    where.category = {
      slug: category,
      isActive: true,
    };
  }

  if (
    size ||
    color ||
    minPrice !== undefined ||
    maxPrice !== undefined
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

        ...(minPrice !== undefined || maxPrice !== undefined
          ? {
              price: {
                ...(minPrice !== undefined && {
                  gte: minPrice,
                }),
                ...(maxPrice !== undefined && {
                  lte: maxPrice,
                }),
              },
            }
          : {}),
      },
    };
  }

  const products = await prisma.product.findMany({
    where,
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

  let formattedProducts = products.map(formatProduct);

  switch (sort) {
    case "oldest":
        formattedProducts.sort(
            (a: any, b: any) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime(),
        );
        break;

    case "newest":
    default:
        formattedProducts.sort(
            (a: any, b: any) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        break;

    case "name_asc":
      formattedProducts.sort((a: any, b: any) =>
        a.name.localeCompare(b.name),
      );
      break;

    case "name_desc":
      formattedProducts.sort((a: any, b: any) =>
        b.name.localeCompare(a.name),
      );
      break;

    case "price_asc":
      formattedProducts.sort(
        (a: any, b: any) =>
          Number(a.startingPrice) -
          Number(b.startingPrice),
      );
      break;

    case "price_desc":
      formattedProducts.sort(
        (a: any, b: any) =>
          Number(b.startingPrice) -
          Number(a.startingPrice),
      );
      break;

  }

  const total = formattedProducts.length;

  const start = (page - 1) * limit;
  const paginatedProducts = formattedProducts.slice(
    start,
    start + limit,
  );

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
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