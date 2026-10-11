
import type { Request, Response, NextFunction } from "express";
import type { Express } from "express";
import fs from "node:fs/promises";
import { AppError } from "../../lib/app-error.js";
import { detectImageMimeType } from "../../lib/storage-upload.js";

export async function validateUploadedImages(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const files =
    (req.files as Express.Multer.File[] | undefined) ?? [];

  try {
    for (const file of files) {
      const buffer =
        file.buffer ??
        (file.path ? await fs.readFile(file.path) : undefined);

      if (
        !buffer ||
        buffer.length === 0 ||
        detectImageMimeType(buffer) !== file.mimetype
      ) {
        throw new AppError(
          400,
          "INVALID_IMAGE_CONTENT",
          "The uploaded file is not a supported image or its content does not match its type.",
        );
      }
    }

    next();
  } catch (error) {
    // Remove files written by Multer if validation fails.
    await Promise.allSettled(
      files
        .filter((file) => Boolean(file.path))
        .map((file) => fs.unlink(file.path)),
    );

    next(error);
  }
}
