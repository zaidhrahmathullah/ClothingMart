import type { Request, Response } from "express";
import type { Express } from "express";
import { AppError } from "../../lib/app-error.js";

export function uploadCategoryImagesController(
  req: Request,
  res: Response,
) {
  const files =
    (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    throw new AppError(
      400,
      "NO_CATEGORY_IMAGES",
      "Select at least one category image to upload.",
    );
  }

  const host = `${req.protocol}://${req.get("host")}`;

  res.status(201).json({
    success: true,
    data: {
      images: files.map((file) => ({
        imageUrl: `${host}/uploads/categories/${file.filename}`,
        originalName: file.originalname,
      })),
    },
  });
}