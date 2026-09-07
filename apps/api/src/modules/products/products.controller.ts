import type { Request, Response } from "express";
import { parseQuery } from "../../lib/validation.js";
import {
  getProductBySlug,
  getProducts,
} from "./products.service.js";
import { productQuerySchema } from "./product.validation.js";

export async function listProducts(
  req: Request,
  res: Response,
) {
  const query = parseQuery(
    productQuerySchema,
    req.query,
  );

  const result = await getProducts(query);

  res.json({
    success: true,
    data: result,
  });
}

export async function getProduct(
  req: Request <{ slug: string }>,
  res: Response,
) {
  const product = await getProductBySlug(
    req.params.slug,
  );

  res.json({
    success: true,
    data: product,
  });
}