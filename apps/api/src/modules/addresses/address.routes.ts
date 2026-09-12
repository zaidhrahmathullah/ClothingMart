import { Router } from "express";

import { authenticate } from "../../middleware/auth.js";

import {
  createAddressController,
  deleteAddressController,
  getAddressesController,
} from "./address.controller.js";

import {
  createAddressSchema,
  addressIdSchema,
} from "./address.validation.js";
import { validateBody, validateParams } from "../../middleware/validate.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getAddressesController,
);

router.post(
  "/",
  validateBody(createAddressSchema),
  createAddressController,
);

router.delete(
  "/:addressId",
  validateParams(addressIdSchema),
  deleteAddressController,
);

export default router;
