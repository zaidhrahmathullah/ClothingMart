import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.service.js";

export async function getCartController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const cart = await getCart(req.user!.sub);

  res.status(200).json({
    success: true,
    data: cart,
  });
}

export async function addCartItemController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { variantId, quantity } = req.body;

  const cart = await addItemToCart(
    req.user!.sub,
    variantId,
    quantity,
  );

  res.status(200).json({
    success: true,
    data: cart,
  });
}

export async function updateCartItemController(
    req: AuthenticatedRequest & Request<{itemId: string}>,
    res: Response,
  ) {
    const { quantity } = req.body;
    const { itemId } = req.params;
    const cart = await updateCartItem(
      req.user!.sub,
      itemId,
      quantity,
    );

  res.status(200).json({
    success: true,
    data: cart,
  });
}

export async function removeCartItemController(
    req: AuthenticatedRequest & Request<{ itemId: string }>,
    res: Response,
  ) {
    const { itemId } = req.params;
    const cart = await removeCartItem(
      req.user!.sub,
      itemId,
    );

  res.status(200).json({
    success: true,
    data: cart,
  });
}

export async function clearCartController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const cart = await clearCart(req.user!.sub);

  res.status(200).json({
    success: true,
    data: cart,
  });
}