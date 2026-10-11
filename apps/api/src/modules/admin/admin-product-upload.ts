
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

const uploadDirectory = path.resolve(
  process.cwd(),
  "uploads/products",
);

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const allowedMimeTypes = new Set(
  Object.keys(extensionByMimeType),
);

const storageProvider = process.env.STORAGE_PROVIDER ?? "local";

if (!["local", "supabase"].includes(storageProvider)) {
  throw new Error("Invalid STORAGE_PROVIDER");
}

if (storageProvider === "local") {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const localStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype];
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

export const productImageUpload = multer({
  storage:
    storageProvider === "supabase"
      ? multer.memoryStorage()
      : localStorage,

  limits: {
    fileSize: 3 * 1024 * 1024,
    files: 6,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new Error(
          "Unsupported product image type. Use JPG, PNG, WebP or GIF.",
        ),
      );
      return;
    }

    callback(null, true);
  },
});

export { uploadDirectory };
