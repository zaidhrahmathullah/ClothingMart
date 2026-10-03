
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { getPayPalConfig } from "./paypal.config.js";

const ENV_KEYS = [
  "NODE_ENV",
  "PAYPAL_ENVIRONMENT",
  "PAYPAL_LIVE_ENABLED",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "PAYPAL_WEBHOOK_ID",
] as const;

const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);

function configurePayPal(
  overrides: Record<string, string | undefined> = {},
) {
  const configuration: Record<string, string | undefined> = {
    NODE_ENV: "development",
    PAYPAL_ENVIRONMENT: "sandbox",
    PAYPAL_LIVE_ENABLED: "false",
    PAYPAL_CLIENT_ID: "test-client-id",
    PAYPAL_CLIENT_SECRET: "test-client-secret",
    PAYPAL_WEBHOOK_ID: "test-webhook-id",
    ...overrides,
  };

  for (const [key, value] of Object.entries(configuration)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv[key];

    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

test("sandbox selects the Sandbox PayPal endpoint", () => {
  configurePayPal();

  const config = getPayPalConfig();

  assert.equal(config.environment, "sandbox");
  assert.equal(
    config.baseUrl,
    "https://api-m.sandbox.paypal.com",
  );
});

test("live environment is blocked during development", () => {
  configurePayPal({
    PAYPAL_ENVIRONMENT: "live",
    PAYPAL_LIVE_ENABLED: "true",
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYPAL_LIVE_DISABLED",
  );
});

test("live environment requires explicit activation", () => {
  configurePayPal({
    NODE_ENV: "production",
    PAYPAL_ENVIRONMENT: "live",
    PAYPAL_LIVE_ENABLED: "false",
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYPAL_LIVE_DISABLED",
  );
});

test("explicitly activated production selects Live PayPal", () => {
  configurePayPal({
    NODE_ENV: "production",
    PAYPAL_ENVIRONMENT: "live",
    PAYPAL_LIVE_ENABLED: "true",
  });

  const config = getPayPalConfig();

  assert.equal(config.environment, "live");
  assert.equal(config.baseUrl, "https://api-m.paypal.com");
});

test("invalid PayPal environment is rejected", () => {
  configurePayPal({
    PAYPAL_ENVIRONMENT: "invalid",
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYPAL_ENVIRONMENT_INVALID",
  );
});

test("missing PayPal environment is rejected", () => {
  configurePayPal({
    PAYPAL_ENVIRONMENT: undefined,
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYPAL_ENVIRONMENT_INVALID",
  );
});

test("missing PayPal credentials are rejected", () => {
  configurePayPal({
    PAYPAL_CLIENT_SECRET: undefined,
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYMENT_PROVIDER_NOT_CONFIGURED",
  );
});

test("missing webhook configuration is rejected", () => {
  configurePayPal({
    PAYPAL_WEBHOOK_ID: undefined,
  });

  assert.throws(
    () => getPayPalConfig(),
    (error: any) => error.code === "PAYPAL_WEBHOOK_NOT_CONFIGURED",
  );
});
