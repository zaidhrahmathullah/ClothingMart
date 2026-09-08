import { Router } from "express";

import { authenticate } from "../../middleware/auth.js";

import {
  createAddressController,
  deleteAddressController,
  getAddressesController,
} from "./address.controller.js";

import {
  createAddressSchema,
} from "./address.validation.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getAddressesController,
);

router.post(
  "/",
  (req, _res, next) => {
    try {
      req.body = createAddressSchema.parse(
        req.body,
      );

      next();
    } catch (error) {
      next(error);
    }
  },
  createAddressController,
);

router.delete(
  "/:addressId",
  deleteAddressController,
);

export default router;