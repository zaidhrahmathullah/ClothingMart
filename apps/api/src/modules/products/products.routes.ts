import { Router } from "express";
import {
  getProduct,
  listProducts,
  listProductFacets,
} from "./products.controller.js";

const router = Router();

router.get("/", listProducts);
router.get("/facets", listProductFacets);
router.get("/:slug", getProduct);

export default router;