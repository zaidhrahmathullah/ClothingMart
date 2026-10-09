import { AppError } from "../../lib/app-error.js";
import { prisma } from "../../lib/prisma.js";
import type { OrderStatus } from "../../generated/prisma/enums.js";

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const productInclude = {
  category: {
    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  },
  images: { orderBy: { sortOrder: "asc" as const } },
  variants: { include: { inventory: true } },
};

const pageInfo = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const productView = (product: any) => ({
  ...product,
  variants: product.variants.map((variant: any) => ({
    ...variant,
    price: variant.price.toString(),
    discountedPrice:
      variant.discountedPrice?.toString() ?? null,
    quantity: variant.inventory?.quantity ?? 0,
    inventory: undefined,
  })),
});


async function assertAssignableSubcategory(categoryId: string) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      parentId: true,
      isActive: true,
      parent: {
        select: {
          id: true,
          isActive: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Selected product category does not exist",
    );
  }

  if (category.parentId === null) {
    throw new AppError(
      400,
      "PRODUCT_REQUIRES_SUBCATEGORY",
      "Please select a subcategory rather than a main category",
    );
  }

  if (!category.isActive || !category.parent?.isActive) {
    throw new AppError(
      400,
      "INACTIVE_PRODUCT_CATEGORY",
      "The selected subcategory and its parent must both be active",
    );
  }

  return category;
}

export async function getDashboard() {
  const now = new Date();

  const revenueStart = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  );

  const [
    products,
    customers,
    orders,
    revenue,
    lowStock,
    orderStatusGroups,
    paymentStatusGroups,
    completedPayments,
  ] = await Promise.all([
    prisma.product.count({
      where: { isActive: true },
    }),

    prisma.user.count({
      where: { role: "CUSTOMER" },
    }),

    prisma.order.count(),

    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "COMPLETED" },
    }),

    prisma.inventory.count({
      where: {
        quantity: {
          lte: 5,
        },
      },
    }),

    prisma.order.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.payment.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: revenueStart,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  const monthlyRevenue = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1,
      );

      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleString("en", {
          month: "short",
        }),
        revenue: 0,
      };
    },
  );

  for (const payment of completedPayments) {
    const bucket = monthlyRevenue.find(
      (entry) =>
        entry.year ===
          payment.createdAt.getFullYear() &&
        entry.month ===
          payment.createdAt.getMonth(),
    );

    if (bucket) {
      bucket.revenue += Number(
        payment.amount,
      );
    }
  }

  return {
    products,
    customers,
    orders,

    revenue:
      revenue._sum?.amount?.toString() ??
      "0.00",

    lowStock,

    orderStatuses: orderStatusGroups.map(
      (group) => ({
        status: group.status,
        count: group._count._all,
      }),
    ),

    paymentStatuses:
      paymentStatusGroups.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),

    monthlyRevenue: monthlyRevenue.map(
      (entry) => ({
        label: entry.label,
        revenue:
          entry.revenue.toFixed(2),
      }),
    ),
  };
}

export async function listProducts(query: any) {
  const where: any = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.categoryId) {
    const selectedCategory = await prisma.category.findUnique({
      where: { id: query.categoryId },
      select: { id: true, parentId: true },
    });

    if (!selectedCategory) {
      throw new AppError(
        404,
        "CATEGORY_NOT_FOUND",
        "Selected category does not exist",
      );
    }

    where.categoryId =
      selectedCategory.parentId === null
        ? {
            in: [
              selectedCategory.id,
              ...(
                await prisma.category.findMany({
                  where: { parentId: selectedCategory.id },
                  select: { id: true },
                })
              ).map((child) => child.id),
            ],
          }
        : selectedCategory.id;
  }
  if (query.search)
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    products: products.map(productView),
    pagination: pageInfo(query.page, query.limit, total),
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });
  if (!product)
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  return productView(product);
}

export async function createProduct(input: any) {
  await assertAssignableSubcategory(input.categoryId);
  const product = await prisma.$transaction((tx) =>
    tx.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        isNew: input.isNew,
        images: {
          create: input.images.map(
            ({ imageUrl, altText, sortOrder }: {
              imageUrl: string;
              altText?: string;
              sortOrder: number;
            }) => ({
              imageUrl,
              altText,
              sortOrder,
            }),
          ),
        },
        variants: {
          create: input.variants.map((v: any) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: v.price.toFixed(2),
            discountedPrice:
              v.discountedPrice === null ||
              v.discountedPrice === undefined
                ? null
                : v.discountedPrice.toFixed(2),
            isActive: v.isActive,
            inventory: { create: { quantity: v.quantity } },
          })),
        },
      },
      include: productInclude,
    }),
  );
  return productView(product);
}

export async function updateProduct(id: string, input: any) {
  const product = await prisma.$transaction(async (tx) => {
    const existing = await tx.product.findUnique({ where: { id } });
    if (!existing)
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");

    if (
      input.categoryId !== undefined &&
      input.categoryId !== existing.categoryId
    ) {
      const selectedCategory = await tx.category.findUnique({
        where: { id: input.categoryId },
        select: {
          parentId: true,
          isActive: true,
          parent: {
            select: { isActive: true },
          },
        },
      });

      if (!selectedCategory) {
        throw new AppError(
          404,
          "CATEGORY_NOT_FOUND",
          "Selected product category does not exist",
        );
      }

      if (selectedCategory.parentId === null) {
        throw new AppError(
          400,
          "PRODUCT_REQUIRES_SUBCATEGORY",
          "Please select a subcategory rather than a main category",
        );
      }

      if (
        !selectedCategory.isActive ||
        !selectedCategory.parent?.isActive
      ) {
        throw new AppError(
          400,
          "INACTIVE_PRODUCT_CATEGORY",
          "The selected subcategory and its parent must both be active",
        );
      }
    }

    if (input.images !== undefined) {
      const incomingImages = input.images as Array<{
        id?: string;
        imageUrl: string;
        altText?: string;
        sortOrder: number;
      }>;

      if (incomingImages.length > 6) {
        throw new AppError(
          400,
          "TOO_MANY_PRODUCT_IMAGES",
          "A product can have a maximum of six images",
        );
      }

      const existingImages = await tx.productImage.findMany({
        where: { productId: id },
        select: { id: true },
      });

      const existingIds = new Set(
        existingImages.map((image) => image.id),
      );

      const submittedIds = incomingImages
        .map((image) => image.id)
        .filter((imageId): imageId is string => Boolean(imageId));

      if (
        new Set(submittedIds).size !== submittedIds.length ||
        submittedIds.some((imageId) => !existingIds.has(imageId))
      ) {
        throw new AppError(
          400,
          "INVALID_PRODUCT_IMAGE",
          "One or more image IDs are duplicated or do not belong to this product",
        );
      }

      // Delete only images explicitly removed from the submitted list.
      await tx.productImage.deleteMany({
        where: {
          productId: id,
          id: { notIn: submittedIds },
        },
      });

      // Preserve existing image records and update their metadata.
      for (const [index, image] of incomingImages.entries()) {
        const data = {
          imageUrl: image.imageUrl,
          altText: image.altText,
          sortOrder: index,
        };

        if (image.id) {
          await tx.productImage.update({
            where: { id: image.id },
            data,
          });
        } else {
          await tx.productImage.create({
            data: {
              ...data,
              productId: id,
            },
          });
        }
      }
    }

    if (input.variants !== undefined) {
      const incomingVariants = input.variants as Array<{
        id?: string;
        sku: string;
        size: string;
        color: string;
        price: number;
        discountedPrice: number | null;
        isActive: boolean;
        quantity?: number;
        expectedQuantity?: number;
      }>;

      const submittedIds = incomingVariants
        .map((variant) => variant.id)
        .filter((variantId): variantId is string => Boolean(variantId));

      if (new Set(submittedIds).size !== submittedIds.length) {
        throw new AppError(
          400,
          "DUPLICATE_VARIANT_ID",
          "The same variant was submitted more than once",
        );
      }

      const existingVariants = await tx.productVariant.findMany({
        where: { productId: id },
        select: {
          id: true,
          sku: true,
          size: true,
          color: true,
          isActive: true,
        },
      });

      const existingIds = new Set(
        existingVariants.map((variant) => variant.id),
      );

      if (submittedIds.some((variantId) => !existingIds.has(variantId))) {
        throw new AppError(
          400,
          "INVALID_PRODUCT_VARIANT",
          "A submitted variant does not belong to this product",
        );
      }

      // Omitted existing variants are retained, not deleted.
      // Validate against their retained values as well.
      const retainedVariants = existingVariants.filter(
        (variant) => !submittedIds.includes(variant.id),
      );

      const effectiveVariants = [
        ...retainedVariants,
        ...incomingVariants,
      ];

      const seenSkus = new Set<string>();
      const seenCombinations = new Set<string>();

      for (const variant of effectiveVariants) {
        const sku = variant.sku.trim().toLowerCase();

        const combination = JSON.stringify([
          variant.size.trim().toLowerCase(),
          variant.color.trim().toLowerCase(),
        ]);

        if (seenSkus.has(sku)) {
          throw new AppError(
            400,
            "DUPLICATE_VARIANT_SKU",
            `Duplicate SKU: ${variant.sku}`,
          );
        }

        if (seenCombinations.has(combination)) {
          throw new AppError(
            400,
            "DUPLICATE_VARIANT_COMBINATION",
            "Duplicate size and colour combination",
          );
        }

        seenSkus.add(sku);
        seenCombinations.add(combination);
      }

      // Check global SKU ownership before performing updates.
      const conflictingSku = await tx.productVariant.findFirst({
        where: {
          sku: {
            in: incomingVariants.map((variant) => variant.sku),
          },
          id: {
            notIn: submittedIds,
          },
        },
        select: { id: true, sku: true },
      });

      if (conflictingSku) {
        throw new AppError(
          409,
          "SKU_ALREADY_EXISTS",
          `SKU ${conflictingSku.sku} is already assigned to another variant`,
        );
      }

      for (const variant of incomingVariants) {
        const data = {
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price: variant.price.toFixed(2),

          discountedPrice:
            variant.discountedPrice === null ||
            variant.discountedPrice === undefined
              ? null
              : variant.discountedPrice.toFixed(2),

          isActive: variant.isActive,
        };

        if (!variant.id) {
          if (variant.quantity === undefined) {
            throw new AppError(
              400,
              "INITIAL_STOCK_REQUIRED",
              "New variants require an initial stock quantity",
            );
          }

          await tx.productVariant.create({
            data: {
              ...data,
              productId: id,
              inventory: {
                create: {
                  quantity: variant.quantity,
                },
              },
            },
          });

          continue;
        }

        await tx.productVariant.update({
          where: { id: variant.id },
          data,
        });

        // Existing stock changes are deliberate and conflict-checked.
        if (variant.quantity !== undefined) {
          if (variant.expectedQuantity === undefined) {
            throw new AppError(
              400,
              "EXPECTED_STOCK_REQUIRED",
              "Expected stock is required for an inventory change",
            );
          }

          const result = await tx.inventory.updateMany({
            where: {
              variantId: variant.id,
              quantity: variant.expectedQuantity,
            },
            data: {
              quantity: variant.quantity,
            },
          });

          if (result.count !== 1) {
            throw new AppError(
              409,
              "INVENTORY_CHANGED",
              "Stock changed since this product was opened. Refresh and try again.",
            );
          }
        }
      }
    }
    return tx.product.update({
      where: { id },
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        isNew: input.isNew,
      },
      include: productInclude,
    });
  });
  return productView(product);
}

export async function deactivateProduct(id: string) {
  try {
    return await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  } catch {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
}

export async function activateProduct(id: string) {
  try {
    return await prisma.product.update({
      where: { id },
      data: { isActive: true },
    });
  } catch {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
}

export async function listCategories(query: any) {
  const where: any = {};

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },

        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
          orderBy: { name: "asc" },
        },

        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [
        { parentId: "asc" },
        { name: "asc" },
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),

    prisma.category.count({ where }),
  ]);

  return {
    categories,
    pagination: pageInfo(query.page, query.limit, total),
  };
}

export async function createCategory(input: any) {
  const { parentId, ...data } = input;

  if (parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        parentId: true,
        isActive: true,
      },
    });

    if (!parent) {
      throw new AppError(
        404,
        "PARENT_CATEGORY_NOT_FOUND",
        "Selected parent category does not exist",
      );
    }

    if (parent.parentId !== null) {
      throw new AppError(
        400,
        "INVALID_CATEGORY_HIERARCHY",
        "A subcategory cannot be used as a parent category",
      );
    }

    if (!parent.isActive) {
      throw new AppError(
        400,
        "INACTIVE_PARENT_CATEGORY",
        "Cannot create a subcategory under an inactive parent",
      );
    }
  }

  return prisma.category.create({
    data: {
      ...data,
      ...(parentId
        ? { parent: { connect: { id: parentId } } }
        : {}),
    },
  });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },

    include: {
      parent: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
        },
      },

      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          cardImageUrl: true,
          animationImageUrl: true,
          bannerImageUrl: true,
        },
        orderBy: { name: "asc" },
      },

      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  if (!category) {
    throw new AppError(
      404,
      "CATEGORY_NOT_FOUND",
      "Category not found",
    );
  }

  return category;
}

export async function updateCategory(id: string, input: any) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.category.findUnique({
      where: { id },
      select: {
        id: true,
        parentId: true,
        isActive: true,
        _count: {
          select: { children: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(
        404,
        "CATEGORY_NOT_FOUND",
        "Category not found",
      );
    }

    // Only validate parent relationships when parentId is explicitly updated.
    if (input.parentId !== undefined) {
      const parentId: string | null = input.parentId;

      if (parentId === id) {
        throw new AppError(
          400,
          "CATEGORY_SELF_PARENT",
          "A category cannot be its own parent",
        );
      }

      if (parentId !== null) {
        // A category with children cannot itself become a subcategory.
        if (existing._count.children > 0) {
          throw new AppError(
            400,
            "INVALID_CATEGORY_HIERARCHY",
            "Move or remove this category's subcategories before assigning a parent",
          );
        }

        const parent = await tx.category.findUnique({
          where: { id: parentId },
          select: {
            id: true,
            parentId: true,
            isActive: true,
          },
        });

        if (!parent) {
          throw new AppError(
            404,
            "PARENT_CATEGORY_NOT_FOUND",
            "Selected parent category does not exist",
          );
        }

        if (parent.parentId !== null) {
          throw new AppError(
            400,
            "INVALID_CATEGORY_HIERARCHY",
            "A subcategory cannot be used as a parent category",
          );
        }

        if (!parent.isActive) {
          throw new AppError(
            400,
            "INACTIVE_PARENT_CATEGORY",
            "Cannot assign a category to an inactive parent",
          );
        }
      }
    }


    // Prevent activating a subcategory under an inactive parent.
    if (input.isActive === true) {
      const effectiveParentId =
        input.parentId !== undefined
          ? input.parentId
          : existing.parentId;

      if (effectiveParentId !== null) {
        const parent = await tx.category.findUnique({
          where: { id: effectiveParentId },
          select: { isActive: true },
        });

        if (!parent?.isActive) {
          throw new AppError(
            409,
            "INACTIVE_PARENT_CATEGORY",
            "Activate the parent category before activating this subcategory",
          );
        }
      }
    }


    // Prevent deactivating a parent while it has active subcategories.
    if (input.isActive === false && existing.isActive) {
      const activeChildren = await tx.category.count({
        where: {
          parentId: id,
          isActive: true,
        },
      });

      if (activeChildren > 0) {
        throw new AppError(
          409,
          "ACTIVE_SUBCATEGORIES_EXIST",
          "Deactivate the subcategories before deactivating their parent",
        );
      }
    }

    const { parentId, ...data } = input;

    return tx.category.update({
      where: { id },
      data: {
        ...data,
        ...(parentId !== undefined
          ? {
              parent: parentId === null
                ? { disconnect: true }
                : { connect: { id: parentId } },
            }
          : {}),
      },
    });
  });
}

export async function listInventory(query: any) {
  const where: any = query.search
    ? {
        variant: {
          OR: [
            { sku: { contains: query.search, mode: "insensitive" } },
            {
              product: {
                name: { contains: query.search, mode: "insensitive" },
              },
            },
          ],
        },
      }
    : {};
  const [inventory, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { variant: { include: { product: true } } },
      orderBy: { quantity: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.inventory.count({ where }),
  ]);
  return { inventory, pagination: pageInfo(query.page, query.limit, total) };
}

export async function updateInventory(variantId: string, quantity: number) {
  try {
    return await prisma.inventory.upsert({
      where: { variantId },
      create: { variantId, quantity },
      update: { quantity },
    });
  } catch {
    throw new AppError(404, "VARIANT_NOT_FOUND", "Product variant not found");
  }
}

export async function listOrders(query: any) {
  const where: any = {};
  if (query.status) {
    if (
      !Object.values(transitions)
        .flat()
        .concat(["PENDING", "DELIVERED", "CANCELLED"])
        .includes(query.status)
    )
      throw new AppError(400, "INVALID_ORDER_STATUS", "Invalid order status");
    where.status = query.status;
  }
  if (query.search)
    where.OR = [
      { id: { contains: query.search } },
      { user: { email: { contains: query.search, mode: "insensitive" } } },
    ];
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        payment: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, pagination: pageInfo(query.page, query.limit, total) };
}

export async function getOrder(id: string) {
  const order =
    await prisma.order.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        payment: {
          include: {
            refunds: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },

        items: true,
      },
    });

  if (!order) {
    throw new AppError(
      404,
      "ORDER_NOT_FOUND",
      "Order not found",
    );
  }

  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
) {
  await prisma.$transaction(async (tx) => {
    /*
     * Lock this Order for the duration of the status transition.
     *
     * This prevents two concurrent admin requests from both
     * observing the same old status and applying cancellation
     * side effects twice.
     */
    await tx.$executeRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${id}, 0)
      )
    `;

    const order =
      await tx.order.findUnique({
        where: {
          id,
        },

        include: {
          items: {
            select: {
              productVariantId: true,
              quantity: true,
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

    /*
     * The existing transition table remains the authority for
     * normal admin Order lifecycle changes.
     */
    if (
      !transitions[order.status].includes(
        status,
      )
    ) {
      throw new AppError(
        409,
        "INVALID_ORDER_TRANSITION",
        `Cannot change order from ${order.status} to ${status}`,
      );
    }

    /*
     * Phase 13 rule:
     *
     * finalizedAt === null
     *   Inventory was never deducted.
     *
     * finalizedAt !== null
     *   Successful payment finalization deducted inventory.
     *
     * Therefore cancellation may restore inventory only for a
     * finalized Order.
     */
    const shouldRestoreInventory =
      status === "CANCELLED" &&
      order.finalizedAt !== null;

    const result =
      await tx.order.updateMany({
        where: {
          id,
          status: order.status,
        },

        data: {
          status,
        },
      });

    if (result.count !== 1) {
      throw new AppError(
        409,
        "ORDER_STATUS_CHANGED",
        "Order status changed. Refresh and try again.",
      );
    }

    if (shouldRestoreInventory) {
      for (const item of order.items) {
        await tx.inventory.update({
          where: {
            variantId:
              item.productVariantId,
          },

          data: {
            quantity: {
              increment:
                item.quantity,
            },
          },
        });
      }
    }
  });

  return getOrder(id);
}

export async function listCustomers(query: any) {
  const where: any = { role: "CUSTOMER" };
  if (query.search)
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
    ];
  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);
  return { customers, pagination: pageInfo(query.page, query.limit, total) };
}

export async function getCustomer(id: string) {
  const customer = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      addresses: true,
      orders: {
        select: { id: true, status: true, total: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer)
    throw new AppError(404, "CUSTOMER_NOT_FOUND", "Customer not found");
  return customer;
}