import type { Request, Response } from "express";
import { OrderStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../../lib/app-error.js";
import { parseQuery } from "../../lib/validation.js";
import * as service from "./admin.service.js";
import {
  categorySchema,
  createProductSchema,
  inventorySchema,
  listQuerySchema,
  productQuerySchema,
  statusSchema,
  updateProductSchema,
} from "./admin.validation.js";

const send = (res: Response, data: unknown, status = 200) =>
  res.status(status).json({ success: true, data });

const parseBody = (
  schema: { parse: (value: unknown) => unknown },
  value: unknown,
) => schema.parse(value);

export const getDashboard = async (_req: Request, res: Response) =>
  send(res, await service.getDashboard());

export const listProducts = async (req: Request, res: Response) =>
  send(
    res,
    await service.listProducts(parseQuery(productQuerySchema, req.query)),
  );

export const getProduct = async (
  req: Request<{ productId: string }>,
  res: Response,
) => send(res, await service.getProduct(req.params.productId));

export const createProduct = async (req: Request, res: Response) =>
  send(
    res,
    await service.createProduct(parseBody(createProductSchema, req.body)),
    201,
  );

export const updateProduct = async (
  req: Request<{ productId: string }>,
  res: Response,
) =>
  send(
    res,
    await service.updateProduct(
      req.params.productId,
      parseBody(updateProductSchema, req.body),
    ),
  );

export const deactivateProduct = async (
  req: Request<{ productId: string }>,
  res: Response,
) => send(res, await service.deactivateProduct(req.params.productId));

export const activateProduct = async (
  req: Request<{ productId: string }>,
  res: Response,
) => send(res, await service.activateProduct(req.params.productId));

export const listCategories = async (req: Request, res: Response) =>
  send(
    res,
    await service.listCategories(parseQuery(listQuerySchema, req.query)),
  );

export const createCategory = async (req: Request, res: Response) =>
  send(
    res,
    await service.createCategory(parseBody(categorySchema, req.body)),
    201,
  );

export const getCategory = async (
  req: Request<{ categoryId: string }>,
  res: Response,
) => send(res, await service.getCategory(req.params.categoryId));

export const updateCategory = async (
  req: Request<{ categoryId: string }>,
  res: Response,
) =>
  send(
    res,
    await service.updateCategory(
      req.params.categoryId,
      parseBody(categorySchema.partial(), req.body),
    ),
  );

export const updateCategoryStatus = async (
  req: Request<{ categoryId: string }>,
  res: Response,
) => {
  const value = parseBody(statusSchema, req.body) as { status: string };
  return send(
    res,
    await service.updateCategory(req.params.categoryId, {
      isActive: value.status === "active" || value.status === "true",
    }),
  );
};

export const deactivateCategory = async (
  req: Request<{ categoryId: string }>,
  res: Response,
) =>
  send(
    res,
    await service.updateCategory(req.params.categoryId, { isActive: false }),
  );

export const listInventory = async (req: Request, res: Response) =>
  send(
    res,
    await service.listInventory(parseQuery(listQuerySchema, req.query)),
  );

export const updateInventory = async (
  req: Request<{ variantId: string }>,
  res: Response,
) => {
  const value = parseBody(inventorySchema, req.body) as { quantity: number };
  return send(
    res,
    await service.updateInventory(req.params.variantId, value.quantity),
  );
};

export const listOrders = async (req: Request, res: Response) =>
  send(res, await service.listOrders(parseQuery(listQuerySchema, req.query)));

export const getOrder = async (
  req: Request<{ orderId: string }>,
  res: Response,
) => send(res, await service.getOrder(req.params.orderId));

export const updateOrderStatus = async (
  req: Request<{ orderId: string }>,
  res: Response,
) => {
  const value = parseBody(statusSchema, req.body) as { status: string };
  if (!Object.values(OrderStatus).includes(value.status as OrderStatus))
    throw new AppError(400, "INVALID_ORDER_STATUS", "Invalid order status");
  return send(
    res,
    await service.updateOrderStatus(
      req.params.orderId,
      value.status as OrderStatus,
    ),
  );
};

export const listCustomers = async (req: Request, res: Response) =>
  send(
    res,
    await service.listCustomers(parseQuery(listQuerySchema, req.query)),
  );

export const getCustomer = async (
  req: Request<{ customerId: string }>,
  res: Response,
) => send(res, await service.getCustomer(req.params.customerId));
