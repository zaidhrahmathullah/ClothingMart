import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
}).strict();

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required"),
}).strict();

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100)
      .optional(),

    email: z
      .string()
      .trim()
      .email("Invalid email address")
      .transform((value) =>
        value.toLowerCase(),
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined,
    {
      message:
        "At least one profile field is required",
    },
  );

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(
        1,
        "Current password is required",
      ),

    newPassword: z
      .string()
      .min(
        8,
        "New password must be at least 8 characters",
      )
      .max(100),

    confirmPassword: z
      .string()
      .min(
        1,
        "Please confirm your new password",
      ),
  })
  .strict()
  .refine(
    (data) =>
      data.newPassword ===
      data.confirmPassword,
    {
      message:
        "New passwords do not match",
      path: ["confirmPassword"],
    },
  )
  .refine(
    (data) =>
      data.currentPassword !==
      data.newPassword,
    {
      message:
        "New password must be different from your current password",
      path: ["newPassword"],
    },
  );