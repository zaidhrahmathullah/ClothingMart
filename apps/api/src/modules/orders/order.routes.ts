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

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getOrdersController,
);

router.get(
  "/:orderId",
  getOrderController,
);

router.post(
  "/",
  (req, _res, next) => {
    try {
      req.body =
        createOrderSchema.parse(req.body);

      next();
    } catch (error) {
      next(error);
    }
  },
  createOrderController,
);

export default router;