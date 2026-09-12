import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";

function isPrismaKnownError(error: unknown): error is { code: string } {
  return Boolean(error && typeof error === "object" && "code" in error);
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request parameters",
        details: error.flatten().fieldErrors,
      },
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });

    return;
  }

  if (isPrismaKnownError(error) && error.code === "P2002") {
    res.status(409).json({ success: false, error: { code: "DUPLICATE_RESOURCE", message: "A record with these details already exists" } });
    return;
  }

  if (isPrismaKnownError(error) && error.code === "P2025") {
    res.status(404).json({ success: false, error: { code: "RESOURCE_NOT_FOUND", message: "The requested resource was not found" } });
    return;
  }

  console.error(error);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
