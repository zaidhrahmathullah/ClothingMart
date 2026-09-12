import { Router } from "express";

import { authenticate } from "../../middleware/auth.js";

import {
  createOrderController,
  getOrderController,
  getOrdersController,
} from "./order.controller.js";

import {
  createOrderSchema,
} from "./order.validation.js";
import { validateBody, validateParams } from "../../middleware/validate.js";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getOrdersController,
);

router.get(
  "/:orderId",
  validateParams(z.object({ orderId: z.string().uuid("Invalid order ID") })),
  getOrderController,
);

router.post(
  "/",
  validateBody(createOrderSchema),
  createOrderController,
);

export default router;
