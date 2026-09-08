import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

import {
  createOrder,
  getUserOrder,
  getUserOrders,
} from "./order.service.js";

export async function createOrderController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const order = await createOrder(
    req.user!.sub,
    req.body.addressId,
  );

  res.status(201).json({
    success: true,
    data: order,
  });
}

export async function getOrdersController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const orders = await getUserOrders(
    req.user!.sub,
  );

  res.status(200).json({
    success: true,
    data: orders,
  });
}

export async function getOrderController(
  req: AuthenticatedRequest & Request<{ orderId: string }>,
  res: Response,
) {
  const order = await getUserOrder(
    req.user!.sub,
    req.params.orderId,
  );

  res.status(200).json({
    success: true,
    data: order,
  });
}