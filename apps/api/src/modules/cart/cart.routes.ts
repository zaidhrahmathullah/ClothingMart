import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { addCartItemSchema, cartItemIdSchema, updateCartItemSchema } from "./cart.validation.js";

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

router.post("/items", validateBody(addCartItemSchema), addCartItemController);

router.patch(
  "/items/:itemId",
  validateParams(cartItemIdSchema),
  validateBody(updateCartItemSchema),
  updateCartItemController,
);

router.delete(
  "/items/:itemId",
  validateParams(cartItemIdSchema),
  removeCartItemController,
);

router.delete("/", clearCartController);

export default router;
