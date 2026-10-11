
import type { Request, Response } from "express";
import type { Express } from "express";
import { AppError } from "../../lib/app-error.js";
import { uploadImageToStorage } from "../../lib/storage-upload.js";
import {
  supabaseStorage,
  STORAGE_BUCKET,
} from "../../lib/supabase-storage.js";

const storageProvider = process.env.STORAGE_PROVIDER ?? "local";

export async function uploadCategoryImagesController(
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

  if (storageProvider === "local") {
    const host = `${req.protocol}://${req.get("host")}`;

    return res.status(201).json({
      success: true,
      data: {
        images: files.map((file) => ({
          imageUrl: `${host}/uploads/categories/${file.filename}`,
          originalName: file.originalname,
        })),
      },
    });
  }

  const uploadedPaths: string[] = [];

  try {
    const images = [];

    for (const file of files) {
      const { imageUrl, objectPath } =
        await uploadImageToStorage(file, "categories");

      uploadedPaths.push(objectPath);

      images.push({
        imageUrl,
        originalName: file.originalname,
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
          "Failed to clean up uploaded category images:",
          cleanupError,
        );
      }
    }

    throw error;
  }
}
