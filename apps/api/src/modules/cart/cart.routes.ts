import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";

import {
  addCartItemController,
  clearCartController,
  getCartController,
  removeCartItemController,
  updateCartItemController,
} from "./cart.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getCartController);

router.post("/items", addCartItemController);

router.patch(
  "/items/:itemId",
  updateCartItemController,
);

router.delete(
  "/items/:itemId",
  removeCartItemController,
);

router.delete("/", clearCartController);

export default router;