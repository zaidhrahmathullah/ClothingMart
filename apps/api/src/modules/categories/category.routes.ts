import { Router } from "express";
import {
  listCategories,
  listCategoryProducts,
} from "./category.controller.js";

const router = Router();

router.get("/", listCategories);
router.get("/:slug/products", listCategoryProducts);

export default router;