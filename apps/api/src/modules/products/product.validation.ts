import { z } from "zod";

export const productQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(12),

  search: z
    .string()
    .trim()
    .min(1)
    .optional(),

  category: z
    .string()
    .trim()
    .min(1)
    .optional(),

  size: z
    .string()
    .trim()
    .min(1)
    .optional(),

  color: z
    .string()
    .trim()
    .min(1)
    .optional(),

  minPrice: z.coerce
    .number()
    .min(0)
    .optional(),

  maxPrice: z.coerce
    .number()
    .min(0)
    .optional(),

  sort: z
    .enum([
      "newest",
      "oldest",
      "name_asc",
      "name_desc",
      "price_asc",
      "price_desc",
    ])
    .default("newest"),
}).refine(
  (data) =>
    data.minPrice === undefined ||
    data.maxPrice === undefined ||
    data.minPrice <= data.maxPrice,
  {
    message: "minPrice cannot be greater than maxPrice",
    path: ["minPrice"],
  },
);