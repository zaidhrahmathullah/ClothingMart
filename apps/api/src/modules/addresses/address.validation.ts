import { z } from "zod";

export const createAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(100, "Full name is too long"),

  phone: z
    .string()
    .trim()
    .min(7, "Phone number is invalid")
    .max(20, "Phone number is invalid"),

  addressLine1: z
    .string()
    .trim()
    .min(3, "Address is required")
    .max(200, "Address is too long"),

  addressLine2: z
    .string()
    .trim()
    .max(200, "Address is too long")
    .optional()
    .or(z.literal("")),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100),

  district: z
    .string()
    .trim()
    .min(2, "District is required")
    .max(100),

  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .max(20),

  country: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .default("Sri Lanka"),
}).strict();

export const addressIdSchema = z.object({
  addressId: z.string().uuid("Invalid address ID"),
});
