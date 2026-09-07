import type { Request, Response } from "express";
import {
  getCategories,
  getCategoryProducts,
} from "./category.service.js";

export async function listCategories(
  _req: Request,
  res: Response,
) {
  const categories = await getCategories();

  res.json({
    success: true,
    data: categories,
  });
}

export async function listCategoryProducts(
  req: Request<{ slug: string }>,
  res: Response,
) {
  const { slug } = req.params;

  const products = await getCategoryProducts(slug);

  if (!products) {
    res.status(404).json({
      success: false,
      error: {
        code: "CATEGORY_NOT_FOUND",
        message: "Category not found",
      },
    });
    return;
  }

  res.json({
    success: true,
    data: products,
  });
}