import { Router } from "express";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
} from "./auth.controller.js";

import { authenticate } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { validateBody } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

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

export default router;
