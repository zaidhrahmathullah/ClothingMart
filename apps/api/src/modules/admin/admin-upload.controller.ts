import type { Request, Response } from "express";
import type { Express } from "express";
import { AppError } from "../../lib/app-error.js";

export function uploadProductImagesController(
  req: Request,
  res: Response,
) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) {
    throw new AppError(400, "NO_PRODUCT_IMAGES", "Select at least one product image to upload.");
  }
  const host = `${req.protocol}://${req.get("host")}`;

  res.status(201).json({
    success: true,
    data: {
      images: files.map((file, index) => ({
        imageUrl: `${host}/uploads/products/${file.filename}`,
        altText: file.originalname.replace(/\.[^/.]+$/, ""),
        sortOrder: index,
      })),
    },
  });
}
