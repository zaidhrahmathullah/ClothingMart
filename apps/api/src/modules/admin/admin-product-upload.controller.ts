

import type { Request, Response } from "express";
import type { Express } from "express";
import { AppError } from "../../lib/app-error.js";
import { uploadImageToStorage } from "../../lib/storage-upload.js";
import {
  supabaseStorage,
  STORAGE_BUCKET,
} from "../../lib/supabase-storage.js";

const storageProvider = process.env.STORAGE_PROVIDER ?? "local";

export async function uploadProductImagesController(
  req: Request,
  res: Response,
) {
  const files =
    (req.files as Express.Multer.File[] | undefined) ?? [];

  if (files.length === 0) {
    throw new AppError(
      400,
      "NO_PRODUCT_IMAGES",
      "Select at least one product image to upload.",
    );
  }

  if (storageProvider === "local") {
    const host = `${req.protocol}://${req.get("host")}`;

    return res.status(201).json({
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

  const uploadedPaths: string[] = [];

  try {
    const images = [];

    for (const [index, file] of files.entries()) {
      const { imageUrl, objectPath } =
        await uploadImageToStorage(file, "products");

      uploadedPaths.push(objectPath);

      images.push({
        imageUrl,
        altText: file.originalname.replace(/\.[^/.]+$/, ""),
        sortOrder: index,
      });


    }

    return res.status(201).json({
      success: true,
      data: { images },
    });
  } catch (error) {
    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await supabaseStorage.storage
        .from(STORAGE_BUCKET)
        .remove(uploadedPaths);

      if (cleanupError) {
        console.error(
          "Failed to clean up uploaded product images:",
          cleanupError,
        );
      }
    }

    throw error;
  }
}
