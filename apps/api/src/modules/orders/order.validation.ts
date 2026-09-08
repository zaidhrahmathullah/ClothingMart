import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z
    .string()
    .uuid("Invalid address ID"),
});