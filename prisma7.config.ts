
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { defineConfig, env } from "prisma/config";

/**
 * Resolve the backend environment file relative to
 * this Prisma configuration, not the terminal's
 * current working directory.
 */
const envPath = fileURLToPath(
  new URL("./apps/api/.env", import.meta.url),
);

/**
 * Local development:
 * Load variables from apps/api/.env.
 *
 * Production:
 * Accept variables injected by the hosting platform
 * even when no physical .env file exists.
 *
 * Existing process.env values are not overwritten.
 */
const result = dotenv.config({
  path: envPath,
  quiet: true,
});

if (result.error) {
  const error = result.error as NodeJS.ErrnoException;

  if (error.code !== "ENOENT") {
    throw new Error(
      `Failed to load Prisma environment file: ${envPath}`,
      { cause: error },
    );
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  datasource: {
    url: env("DATABASE_URL"),
  },
});
