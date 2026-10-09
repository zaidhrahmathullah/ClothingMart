import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const envPath = fileURLToPath(
  new URL("../.env.test", import.meta.url),
);

const envContent = readFileSync(envPath, "utf8");

const match = envContent.match(
  /^\s*DATABASE_URL\s*=\s*(.+)\s*$/m,
);

if (!match) {
  throw new Error("DATABASE_URL is missing from .env.test");
}

const connectionString = match[1]
  .trim()
  .replace(/^["']|["']$/g, "");

const databaseUrl = new URL(connectionString);

if (databaseUrl.protocol !== "postgresql:" &&
    databaseUrl.protocol !== "postgres:") {
  throw new Error("Expected a PostgreSQL connection");
}

if (databaseUrl.pathname !== "/clothingmart_test") {
  throw new Error(
    "SAFETY ERROR: Category tests require clothingmart_test",
  );
}

if (!["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)) {
  throw new Error(
    "SAFETY ERROR: Category tests must use local PostgreSQL",
  );
}

const result = spawnSync(
  process.execPath,
  [
    "--import",
    "tsx",
    "--test",
    "src/modules/categories/category.hierarchy.test.ts",
  ],
  {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      NODE_ENV: "test",
    },
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);