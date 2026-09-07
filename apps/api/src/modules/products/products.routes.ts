import { Router } from "express";
import {
  getProduct,
  listProducts,
} from "./products.controller.js";

const router = Router();

router.get("/", listProducts);
router.get("/:slug", getProduct);

export default router;