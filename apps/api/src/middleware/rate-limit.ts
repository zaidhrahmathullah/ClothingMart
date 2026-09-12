import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error.js";

type Entry = { count: number; resetAt: number };

/** A small, dependency-free limiter for sensitive unauthenticated endpoints. */
export function rateLimit({ windowMs, max }: { windowMs: number; max: number }) {
  const entries = new Map<string, Entry>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || "unknown";
    const existing = entries.get(key);
    const entry = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;

    entry.count += 1;
    entries.set(key, entry);

    if (entry.count > max) {
      next(new AppError(429, "RATE_LIMITED", "Too many requests. Please try again later."));
      return;
    }
    next();
  };
}
