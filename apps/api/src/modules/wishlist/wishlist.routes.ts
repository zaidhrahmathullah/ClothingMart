import { Router } from "express";

import {
  addWishlistItem,
  getWishlist,
  getWishlistIds,
  removeWishlistItem,
} from "./wishlist.controller.js";

import { authenticate } from "../../middleware/auth.js";
import { validateParams } from "../../middleware/validate.js";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.get("/", getWishlist);

router.get("/ids", getWishlistIds);

const productIdSchema = z.object({ productId: z.string().uuid("Invalid product ID") });

router.post("/:productId", validateParams(productIdSchema), addWishlistItem);

router.delete("/:productId", validateParams(productIdSchema), removeWishlistItem);

export default router;
