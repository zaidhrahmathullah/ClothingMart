
import { randomUUID } from "node:crypto";
import type { Express } from "express";
import { supabaseStorage, STORAGE_BUCKET } from "./supabase-storage.js";
import { AppError } from "./app-error.js";

type ImageFolder = "products" | "categories";

export type UploadedStorageImage = {
  imageUrl: string;
  objectPath: string;
};

const extensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;

export function detectImageMimeType(buffer: Buffer): string | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(
      buffer.toString("ascii", 0, 6),
    )
  ) {
    return "image/gif";
  }

  return null;
}

export async function uploadImageToStorage(
  file: Express.Multer.File,
  folder: ImageFolder,
): Promise<UploadedStorageImage> {
  if (!file.buffer || file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    throw new AppError(
        400,
        "INVALID_IMAGE_FILE",
        "The image is empty or exceeds the 3 MB limit.",
    );
  }

  const detectedMimeType = detectImageMimeType(file.buffer);

  if (!detectedMimeType || detectedMimeType !== file.mimetype) {
    throw new AppError(
        400,
        "INVALID_IMAGE_CONTENT",
        "The uploaded file is not a supported image or its content does not match its type.",
    );
  }

  const extension = extensions[detectedMimeType];
  const objectPath = `${folder}/${randomUUID()}.${extension}`;

  const { error } = await supabaseStorage.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: detectedMimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase image upload failed:", error.message);
    throw new AppError(
        502,
        "IMAGE_STORAGE_UNAVAILABLE",
        "Unable to upload the image. Please try again.",
    );
  }

  const { data } = supabaseStorage.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(objectPath);

  return {
    imageUrl: data.publicUrl,
    objectPath,
  };
}
