
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);

const envPath = path.resolve(
  currentDirectory,
  "../../.env",
);

/**
 * Load local environment variables when available.
 *
 * In production, hosting platforms may inject environment
 * variables directly without creating a physical .env file.
 *
 * dotenv does not override existing process.env values
 * unless override: true is explicitly supplied.
 */
const result = dotenv.config({
  path: envPath,
  quiet: true,
});

if (result.error) {
  const error = result.error as NodeJS.ErrnoException;

  // A missing local .env file is acceptable when the
  // environment is supplied by the hosting platform.
  if (error.code !== "ENOENT") {
    throw new Error(
      `Failed to load backend environment file: ${envPath}`,
      { cause: error },
    );
  }
}
