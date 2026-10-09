import { Router } from "express";

import {
  changePasswordController,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateProfileController,
} from "./auth.controller.js";

import { authenticate } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate.js";import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.validation.js";

const router = Router();

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

router.post("/register", authRateLimit, validateBody(registerSchema), registerUser);
router.post("/login", authRateLimit, validateBody(loginSchema), loginUser);
router.post("/refresh", authRateLimit, refreshAccessToken);
router.post("/logout", logoutUser);

router.get(
  "/me",
  authenticate,
  getCurrentUser,
);

router.patch(
  "/profile",
  authenticate,
  validateBody(updateProfileSchema),
  updateProfileController,
);

router.patch(
  "/password",
  authenticate,
  authRateLimit,
  validateBody(changePasswordSchema),
  changePasswordController,
);

export default router;
