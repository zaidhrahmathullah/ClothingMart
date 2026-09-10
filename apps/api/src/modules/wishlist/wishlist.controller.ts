import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

import {
  addWishlistItem as addItem,
  getWishlist as getItems,
  getWishlistIds as getIds,
  removeWishlistItem as removeItem,
} from "./wishlist.service.js";

export async function getWishlist(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data = await getItems(req.user!.sub);

  res.json({
    success: true,
    data,
  });
}

export async function getWishlistIds(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data = await getIds(req.user!.sub);

  res.json({
    success: true,
    data,
  });
}

export async function addWishlistItem(
  req: AuthenticatedRequest & Request<{ productId: string }>,
  res: Response,
) {
  const { productId } = req.params;

  await addItem(req.user!.sub, productId);

  res.status(201).json({
    success: true,
    data: null,
  });
}

export async function removeWishlistItem(
  req: AuthenticatedRequest & Request<{ productId: string }>,
  res: Response,
) {
  const { productId } = req.params;

  await removeItem(req.user!.sub, productId);

  res.json({
    success: true,
    data: null,
  });
}
