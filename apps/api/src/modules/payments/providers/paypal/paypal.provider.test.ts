import assert from "node:assert/strict";
import test from "node:test";

import {
  PAYMENT_PROVIDERS,
} from "../../payment.types.js";

import { PayPalProvider } from "./paypal.provider.js";

test(
  "PayPal Sandbox order can be created for capture",
  async () => {
    const provider =
      new PayPalProvider();

    assert.equal(
      provider.name,
      PAYMENT_PROVIDERS.PAYPAL,
    );

    const result =
      await provider.createPayment({
        orderId:
          "phase5-capture-test",
        amount: "10.00",
        currency: "USD",
        idempotencyKey:
          "test-payment-create-idempotency-key",
      });

    assert.ok(
      result.providerOrderId,
    );

    assert.ok(
      result.approvalUrl,
    );

    console.log(
      "\nPayPal Sandbox Order ID:",
      result.providerOrderId,
    );

    console.log(
      "\nPayPal Sandbox Approval URL:",
      result.approvalUrl,
    );

    assert.equal(
      typeof result.providerOrderId,
      "string",
    );

    assert.equal(
      typeof result.approvalUrl,
      "string",
    );
  },
);