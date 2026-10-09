import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const categoryUploadDirectory = path.resolve(
  process.cwd(),
  "uploads/categories",
);

fs.mkdirSync(categoryUploadDirectory, {
  recursive: true,
});

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const allowedMimeTypes = new Set(
  Object.keys(extensionByMimeType),
);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, categoryUploadDirectory);
  },

  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype];

    callback(
      null,
      `${crypto.randomUUID()}${extension}`,
    );
  },
});

export const categoryImageUpload = multer({
  storage,

  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 3,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new Error(
          "Unsupported category image type. Use JPG, PNG, WebP or GIF.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});