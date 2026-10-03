"use client";

import {
  useMemo,
  useState,
} from "react";

import { adminApi } from "../admin-api";

import type {
  AdminCreateRefundInput,
  AdminPayment,
} from "../admin-types";

import {
  AdminButton,
  AdminCard,
  formatDate,
  formatMoney,
  inputClass,
} from "./AdminPrimitives";

type Props = {
  payments: AdminPayment[];

  onRefundCompleted: () => Promise<void>;
};

const refundReasons: Array<{
  value: AdminCreateRefundInput["reason"];
  label: string;
}> = [
  {
    value: "CUSTOMER_REQUEST",
    label: "Customer request",
  },
  {
    value: "DUPLICATE_PAYMENT",
    label: "Duplicate payment",
  },
  {
    value: "ORDER_ISSUE",
    label: "Order issue",
  },
  {
    value: "PRODUCT_ISSUE",
    label: "Product issue",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

function metadataRecord(
  metadata: unknown,
): Record<string, unknown> | null {
  if (
    !metadata ||
    typeof metadata !== "object" ||
    Array.isArray(metadata)
  ) {
    return null;
  }

  return metadata as Record<
    string,
    unknown
  >;
}

function metadataString(
  metadata: unknown,
  key: string,
) {
  const record =
    metadataRecord(metadata);

  const value =
    record?.[key];

  return typeof value === "string"
    ? value
    : null;
}

function providerAmount(
  payment: AdminPayment,
) {
  return metadataString(
    payment.metadata,
    "paymentAmount",
  );
}

function providerCurrency(
  payment: AdminPayment,
) {
  return metadataString(
    payment.metadata,
    "paymentCurrency",
  );
}

function completedRefundTotal(
  payment: AdminPayment,
) {
  return (payment.refunds ?? [])
    .filter(
      (refund) =>
        refund.status === "COMPLETED",
    )
    .reduce(
      (total, refund) =>
        total +
        Number(refund.amount),
      0,
    );
}

function canRefund(
  payment: AdminPayment,
) {
  return (
    payment.status === "COMPLETED" ||
    payment.status ===
      "PARTIALLY_REFUNDED"
  );
}

export default function AdminPaymentManagement({
  payments,
  onRefundCompleted,
}: Props) {
  if (payments.length === 0) {
    return (
      <AdminCard>
        <h2 className="font-semibold text-neutral-950">
          Payment
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          No payment record is associated with
          this order.
        </p>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-5">
      {payments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          onRefundCompleted={
            onRefundCompleted
          }
        />
      ))}
    </div>
  );
}

function PaymentCard({
  payment,
  onRefundCompleted,
}: {
  payment: AdminPayment;
  onRefundCompleted: () => Promise<void>;
}) {
  const [refundMode, setRefundMode] =
    useState<"FULL" | "PARTIAL">(
      "FULL",
    );

  const [amount, setAmount] =
    useState("");

  const [reason, setReason] =
    useState<
      AdminCreateRefundInput["reason"]
    >("CUSTOMER_REQUEST");

  const [adminNote, setAdminNote] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * One key represents one logical submission.
   *
   * It is regenerated only after a definitively
   * successful refund. If the request fails with
   * an uncertain network/provider outcome, retrying
   * reuses the same key.
   */
  const [idempotencyKey, setIdempotencyKey] =
    useState(() =>
      crypto.randomUUID(),
    );

  const payAmount =
    providerAmount(payment);

  const payCurrency =
    providerCurrency(payment);

  const refunded =
    useMemo(
      () =>
        completedRefundTotal(payment),
      [payment],
    );

  const remaining =
    payAmount
      ? Math.max(
          Number(payAmount) -
            refunded,
          0,
        )
      : null;

  async function submitRefund() {
    if (submitting) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      refundMode === "PARTIAL"
    ) {
      const numericAmount =
        Number(amount);

      if (
        !amount ||
        !Number.isFinite(
          numericAmount,
        ) ||
        numericAmount <= 0
      ) {
        setError(
          "Enter a valid partial refund amount.",
        );

        return;
      }

      if (
        remaining !== null &&
        numericAmount > remaining
      ) {
        setError(
          "Refund amount exceeds the remaining refundable balance.",
        );

        return;
      }
    }

    const description =
      refundMode === "FULL"
        ? "the full remaining payment"
        : `${amount} ${
            payCurrency ?? ""
          }`;

    const confirmed =
      window.confirm(
        `Refund ${description.trim()}? This will send a real refund request to the payment provider.`,
      );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const body:
        AdminCreateRefundInput = {
        reason,
        idempotencyKey,
      };

      if (
        refundMode === "PARTIAL"
      ) {
        body.amount =
          Number(amount).toFixed(2);
      }

      const trimmedNote =
        adminNote.trim();

      if (trimmedNote) {
        body.adminNote =
          trimmedNote;
      }

      await adminApi.createPaymentRefund(
        payment.id,
        body,
      );

      setSuccess(
        "Refund request processed successfully.",
      );

      setAmount("");
      setAdminNote("");

      /*
       * The completed logical request gets a new
       * key only after success.
       */
      setIdempotencyKey(
        crypto.randomUUID(),
      );

      await onRefundCompleted();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to process refund",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-neutral-950">
            Payment
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            {payment.provider}
          </p>
        </div>

        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
          {payment.status}
        </span>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <Detail
          label="ClothingMart amount"
          value={formatMoney(
            payment.amount,
          )}
        />

        {payAmount &&
          payCurrency && (
            <Detail
              label="Provider amount"
              value={`${payCurrency} ${payAmount}`}
            />
          )}

        <Detail
          label="Provider"
          value={payment.provider}
        />

        <Detail
          label="Transaction / Capture ID"
          value={
            payment.transactionReference ??
            payment.providerPaymentId ??
            "—"
          }
        />

        <Detail
          label="Provider Order ID"
          value={
            payment.providerOrderId ??
            "—"
          }
        />

        <Detail
          label="Created"
          value={formatDate(
            payment.createdAt,
          )}
        />

        {payCurrency &&
          remaining !== null && (
            <Detail
              label="Remaining refundable"
              value={`${payCurrency} ${remaining.toFixed(
                2,
              )}`}
            />
          )}
      </dl>

      <div className="mt-6 border-t border-neutral-200 pt-5">
        <h3 className="font-semibold text-neutral-950">
          Refund history
        </h3>

        {(payment.refunds ?? [])
          .length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            No refunds have been recorded.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {(payment.refunds ?? []).map(
              (refund) => (
                <div
                  key={refund.id}
                  className="rounded-xl border border-neutral-200 p-3 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">
                      {refund.currency}{" "}
                      {refund.amount}
                    </span>

                    <span className="text-xs font-semibold text-neutral-600">
                      {refund.status}
                    </span>
                  </div>

                  <p className="mt-2 text-neutral-600">
                    {refund.reason.replaceAll(
                      "_",
                      " ",
                    )}
                  </p>

                  {refund.adminNote && (
                    <p className="mt-1 text-neutral-500">
                      {refund.adminNote}
                    </p>
                  )}

                  {refund.providerRefundId && (
                    <p className="mt-1 break-all text-xs text-neutral-500">
                      PayPal refund:{" "}
                      {
                        refund.providerRefundId
                      }
                    </p>
                  )}

                  <p className="mt-2 text-xs text-neutral-400">
                    {formatDate(
                      refund.createdAt,
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {canRefund(payment) && (
        <div className="mt-6 border-t border-neutral-200 pt-5">
          <h3 className="font-semibold text-neutral-950">
            Issue refund
          </h3>

          <p className="mt-1 text-sm text-neutral-500">
            Refunds are sent through{" "}
            {payment.provider}. Inventory and
            order status are not changed
            automatically.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                setRefundMode("FULL")
              }
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                refundMode === "FULL"
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              Full refund
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                setRefundMode(
                  "PARTIAL",
                )
              }
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                refundMode ===
                "PARTIAL"
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              Partial refund
            </button>
          </div>

          {refundMode ===
            "PARTIAL" && (
            <div className="mt-4">
              <label className="text-sm font-medium text-neutral-700">
                Refund amount{" "}
                {payCurrency
                  ? `(${payCurrency})`
                  : ""}
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                disabled={submitting}
                onChange={(event) =>
                  setAmount(
                    event.target.value,
                  )
                }
                className={`${inputClass} mt-1`}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm font-medium text-neutral-700">
              Reason
            </label>

            <select
              value={reason}
              disabled={submitting}
              onChange={(event) =>
                setReason(
                  event.target
                    .value as AdminCreateRefundInput["reason"],
                )
              }
              className={`${inputClass} mt-1`}
            >
              {refundReasons.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-neutral-700">
              Admin note{" "}
              <span className="font-normal text-neutral-400">
                (optional)
              </span>
            </label>

            <textarea
              value={adminNote}
              disabled={submitting}
              maxLength={1000}
              onChange={(event) =>
                setAdminNote(
                  event.target.value,
                )
              }
              className={`${inputClass} mt-1 min-h-24`}
              placeholder="Internal note about this refund..."
            />
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="mt-3 text-sm font-medium text-green-700">
              {success}
            </p>
          )}

          <div className="mt-4">
            <AdminButton
              disabled={
                submitting ||
                remaining === 0
              }
              onClick={
                submitRefund
              }
              variant="danger"
            >
              {submitting
                ? "Processing refund..."
                : refundMode ===
                    "FULL"
                  ? "Refund remaining payment"
                  : "Issue partial refund"}
            </AdminButton>
          </div>
        </div>
      )}
    </AdminCard>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-neutral-500">
        {label}
      </dt>

      <dd className="max-w-[60%] break-all text-right font-medium text-neutral-900">
        {value}
      </dd>
    </div>
  );
}