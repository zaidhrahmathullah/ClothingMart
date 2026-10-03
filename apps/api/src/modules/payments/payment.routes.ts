import { Router } from "express";


import {
  capturePaymentController,
  createPaymentController,
  paypalWebhookController,
  cancelPaymentController,
  getPublicPayPalConfigController,
} from "./providers/paypal/paypal.controller.js";


import {
  authenticate,
} from "../../middleware/auth.js";

import {
  validateBody,
} from "../../middleware/validate.js";

import {
  createPaymentSchema,
  capturePaymentSchema,
  cancelPaymentSchema,
} from "./payment.validation.js";


const router = Router();


router.get(
  "/config/paypal",
  getPublicPayPalConfigController,
);


router.post(
  "/webhooks/paypal",
  paypalWebhookController,
);


router.post(
  "/",
  authenticate,
  validateBody(createPaymentSchema),
  createPaymentController,
);


router.post(
  "/capture",
  authenticate,
  validateBody(capturePaymentSchema),
  capturePaymentController,
);


router.post(
  "/cancel",
  authenticate,
  validateBody(cancelPaymentSchema),
  cancelPaymentController,
);


export default router;