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
  category: true,
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
    quantity: variant.inventory?.quantity ?? 0,
    inventory: undefined,
  })),
});

export async function getDashboard() {
  const [products, customers, orders, revenue, lowStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "PAID" },
    }),
    prisma.inventory.count({ where: { quantity: { lte: 5 } } }),
  ]);
  return {
    products,
    customers,
    orders,
    revenue: revenue._sum.amount?.toString() ?? "0.00",
    lowStock,
  };
}

export async function listProducts(query: any) {
  const where: any = {};
  if (query.isActive !== undefined) where.isActive = query.isActive;
  if (query.categoryId) where.categoryId = query.categoryId;
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
  const product = await prisma.$transaction((tx) =>
    tx.product.create({
      data: {
        categoryId: input.categoryId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        isNew: input.isNew,
        images: { create: input.images },
        variants: {
          create: input.variants.map((v: any) => ({
            sku: v.sku,
            size: v.size,
            color: v.color,
            price: v.price.toFixed(2),
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
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
    }
    if (input.variants) {
      for (const v of input.variants) {
        const data = {
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price.toFixed(2),
          isActive: v.isActive,
        };
        const saved = v.id
          ? await tx.productVariant.update({ where: { id: v.id }, data })
          : await tx.productVariant.create({
              data: { ...data, productId: id },
            });
        await tx.inventory.upsert({
          where: { variantId: saved.id },
          create: { variantId: saved.id, quantity: v.quantity },
          update: { quantity: v.quantity },
        });
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
        ...(input.images ? { images: { create: input.images } } : {}),
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
  if (query.search)
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { slug: { contains: query.search, mode: "insensitive" } },
    ];
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.category.count({ where }),
  ]);
  return { categories, pagination: pageInfo(query.page, query.limit, total) };
}

export async function createCategory(input: any) {
  return prisma.category.create({ data: input });
}

export async function getCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category)
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  return category;
}

export async function updateCategory(id: string, input: any) {
  try {
    return await prisma.category.update({ where: { id }, data: input });
  } catch {
    throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
  }
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
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      payment: true,
      items: true,
    },
  });
  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const order = await getOrder(id);
  if (!transitions[order.status].includes(status))
    throw new AppError(
      409,
      "INVALID_ORDER_TRANSITION",
      `Cannot change order from ${order.status} to ${status}`,
    );
  await prisma.order.update({ where: { id }, data: { status } });
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
