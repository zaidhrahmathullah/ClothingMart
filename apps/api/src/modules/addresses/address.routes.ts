import { Router } from "express";

import { authenticate } from "../../middleware/auth.js";
import {
  validateBody,
  validateParams,
} from "../../middleware/validate.js";

import {
  createAddressController,
  deleteAddressController,
  getAddressesController,
  setDefaultAddressController,
  updateAddressController,
} from "./address.controller.js";

import {
  addressIdSchema,
  createAddressSchema,
  updateAddressSchema,
} from "./address.validation.js";

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

router.patch(
  "/:addressId",
  validateParams(addressIdSchema),
  validateBody(updateAddressSchema),
  updateAddressController,
);

router.patch(
  "/:addressId/default",
  validateParams(addressIdSchema),
  setDefaultAddressController,
);

router.delete(
  "/:addressId",
  validateParams(addressIdSchema),
  deleteAddressController,
);

export default router;