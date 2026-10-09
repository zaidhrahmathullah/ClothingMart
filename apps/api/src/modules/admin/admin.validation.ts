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


const requiredNumber = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === ""
      ? undefined
      : value,
  z.coerce.number().finite(),
);

const optionalNumber = z.preprocess(
  (value) => {
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" &&
        value.trim() === "")
    ) {
      return null;
    }

    return value;
  },
  z.coerce.number().finite().nullable(),
);

const imageSchema = z.object({
  id: id.optional(),
  imageUrl,
  altText: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});


const variantBaseSchema = z.object({
  id: id.optional(),

  sku: z.string().trim().min(1, "SKU is required"),
  size: z.string().trim().min(1, "Size is required"),
  color: z.string().trim().min(1, "Color is required"),

  price: requiredNumber.refine(
    (value) => value >= 0,
    "Price cannot be negative",
  ),

  discountedPrice: optionalNumber.refine(
    (value) => value === null || value >= 0,
    "Discounted price cannot be negative",
  ),

  isActive: z.boolean().default(true),
});

const stockNumber = requiredNumber.refine(
  (value) => Number.isSafeInteger(value) && value >= 0,
  "Quantity must be a non-negative whole number",
);

const createVariantSchema = variantBaseSchema
  .omit({ id: true })
  .extend({
    quantity: stockNumber,
  });

const updateVariantSchema = variantBaseSchema
  .extend({
    quantity: stockNumber.optional(),
    expectedQuantity: stockNumber.optional(),
  })
  .superRefine((variant, ctx) => {
    if (!variant.id && variant.quantity === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["quantity"],
        message: "New variants require an initial quantity",
      });
    }

    if (
      variant.id &&
      variant.quantity !== undefined &&
      variant.expectedQuantity === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expectedQuantity"],
        message: "Expected stock is required when changing existing stock",
      });
    }
  });

function validateVariantDuplicates(
  variants: Array<{
    sku: string;
    size: string;
    color: string;
  }>,
  ctx: z.RefinementCtx,
) {
  const skus = new Set<string>();
  const combinations = new Set<string>();

  variants.forEach((variant, index) => {
    const sku = variant.sku.trim().toLowerCase();

    const combination = JSON.stringify([
      variant.size.trim().toLowerCase(),
      variant.color.trim().toLowerCase(),
    ]);

    if (skus.has(sku)) {
      ctx.addIssue({
        code: "custom",
        path: [index, "sku"],
        message: "Duplicate SKU within this product",
      });
    }

    if (combinations.has(combination)) {
      ctx.addIssue({
        code: "custom",
        path: [index, "size"],
        message: "Duplicate size and colour combination",
      });
    }

    skus.add(sku);
    combinations.add(combination);
  });
}

const productBaseSchema = z.object({
  categoryId: id,
  name: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(200),
  description: z.string().trim().optional(),
  isNew: z.boolean().default(false),
  images: z.array(imageSchema).max(6).default([]),
});

export const createProductSchema = productBaseSchema
  .extend({
    variants: z.array(createVariantSchema).min(1),
  })
  .superRefine((product, ctx) => {
    validateVariantDuplicates(product.variants, {
      addIssue: (issue) => {
        if (typeof issue === "string") {
          ctx.addIssue({
            code: "custom",
            path: ["variants"],
            message: issue,
          });
          return;
        }

        ctx.addIssue({
          ...issue,
          path: ["variants", ...(issue.path ?? [])],
        });
      },
    } as z.RefinementCtx);
  });

export const updateProductSchema = productBaseSchema
  .partial()
  .extend({
    variants: z.array(updateVariantSchema).min(1).optional(),
  })
  .superRefine((product, ctx) => {
    if (product.variants) {
      validateVariantDuplicates(product.variants, {
        addIssue: (issue) => {
          if (typeof issue === "string") {
            ctx.addIssue({
              code: "custom",
              path: ["variants"],
              message: issue,
            });
            return;
          }

          ctx.addIssue({
            ...issue,
            path: ["variants", ...(issue.path ?? [])],
          });
        },
      } as z.RefinementCtx);
    }
  });


export const categorySchema = z.object({
  name: z.string().trim().min(1).max(120),

  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only",
    ),

  description: z.string().trim().optional(),

  // Null indicates a main/parent category.
  parentId: id.nullable().optional(),

  // Category card image.
  cardImageUrl: imageUrl.nullable().optional(),

  // Image used for category card hover animation.
  animationImageUrl: imageUrl.nullable().optional(),

  // Background image for individual category pages.
  bannerImageUrl: imageUrl.nullable().optional(),

  isActive: z.boolean().optional(),
});

export const statusSchema = z.object({ status: z.string().trim().min(1) });

export const inventorySchema = z.object({
  quantity: z.coerce.number().int().min(0),
});