import { z } from "zod";

export const addCartItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

export const cartItemIdSchema = z.object({
  itemId: z.string().uuid(),
});

export type AddCartItemInput = z.infer<
  typeof addCartItemSchema
>;

export type UpdateCartItemInput = z.infer<
  typeof updateCartItemSchema
>;