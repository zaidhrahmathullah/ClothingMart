import { z } from "zod";

const id = z.string().uuid();
const page = z.coerce.number().int().min(1).default(1);
const limit = z.coerce.number().int().min(1).max(100).default(20);
const imageUrl = z
  .string()
  .trim()
  .min(1)
  .max(6_000_000)
  .refine(
    (value) =>
      value.startsWith("/") ||
      /^https?:\/\/[^\s]+$/i.test(value) ||
      /^data:image\/(jpeg|png|webp|gif);base64,[a-z0-9+/=]+$/i.test(value),
    "Image must be a relative path, HTTP URL, or supported image data URL",
  );

export const listQuerySchema = z.object({
  page,
  limit,
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
});

export const productQuerySchema = listQuerySchema.extend({
  categoryId: id.optional(),
  isActive: z.coerce.boolean().optional(),
});

const variantSchema = z.object({
  id: id.optional(),
  sku: z.string().trim().min(1),
  size: z.string().trim().min(1),
  color: z.string().trim().min(1),
  price: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const imageSchema = z.object({
  imageUrl,
  altText: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const createProductSchema = z.object({
  categoryId: id,
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200),
  description: z.string().trim().optional(),
  isNew: z.boolean().default(false),
  variants: z.array(variantSchema).min(1),
  images: z.array(imageSchema).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(160),
  description: z.string().trim().optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const statusSchema = z.object({ status: z.string().trim().min(1) });

export const inventorySchema = z.object({
  quantity: z.coerce.number().int().min(0),
});
