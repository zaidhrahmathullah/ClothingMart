import { Router } from "express";

import {
  addWishlistItem,
  getWishlist,
  getWishlistIds,
  removeWishlistItem,
} from "./wishlist.controller.js";

import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", getWishlist);

router.get("/ids", getWishlistIds);

router.post("/:productId", addWishlistItem);

router.delete("/:productId", removeWishlistItem);

export default router;