"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  CreditCard,
  RotateCcw,
} from "lucide-react";

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
import {
  useNotification,
} from "@/components/feedback/NotificationProvider";

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
  const value =
    metadataRecord(metadata)?.[key];

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
        total + Number(refund.amount),
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

function paymentStatusClass(
  status: AdminPayment["status"],
) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "PARTIALLY_REFUNDED":
      return "bg-amber-50 text-amber-700";

    case "REFUNDED":
      return "bg-blue-50 text-blue-700";

    case "FAILED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function refundStatusClass(
  status: string,
) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "PENDING":
    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export default function AdminPaymentManagement({
  payments,
  onRefundCompleted,
}: Props) {
  if (payments.length === 0) {
    return (
      <AdminCard>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
            <CreditCard className="h-3.5 w-3.5" />
          </div>

          <div>
            <h2 className="text-[12px] font-semibold text-neutral-950">
              No payment record
            </h2>

            <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
              No payment is associated
              with this order.
            </p>
          </div>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
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
  const [
    refundMode,
    setRefundMode,
  ] = useState<
    "FULL" | "PARTIAL"
  >("FULL");

  const [amount, setAmount] =
    useState("");

  const [reason, setReason] =
    useState<
      AdminCreateRefundInput["reason"]
    >("CUSTOMER_REQUEST");

  const [
    adminNote,
    setAdminNote,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const notification =
    useNotification();

  // One key per logical refund request.
  // Failed/uncertain retries intentionally
  // retain the same idempotency key.
  const [
    idempotencyKey,
    setIdempotencyKey,
  ] = useState(() =>
    crypto.randomUUID(),
  );

  const payAmount =
    providerAmount(payment);

  const payCurrency =
    providerCurrency(payment);

  const refunded = useMemo(
    () =>
      completedRefundTotal(payment),
    [payment],
  );

  const remaining = payAmount
    ? Math.max(
        Number(payAmount) -
          refunded,
        0,
      )
    : null;

  async function submitRefund() {
    if (submitting) return;

    setError("");

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
      await notification.confirm({
        title: "Confirm refund",
        message: `Refund ${description.trim()}? This will send a real refund request to the payment provider and cannot be undone from ClothingMart.`,
        confirmLabel:
          "Issue refund",
        cancelLabel:
          "Keep payment",
        tone: "danger",
      });

    if (!confirmed) return;

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

      notification.success(
        "The refund was processed successfully.",
        "Refund completed",
      );

      setAmount("");
      setAdminNote("");

      // Generate a fresh key only after
      // definitive success.
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
      {/* Payment heading */}
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-700">
            <CreditCard className="h-3.5 w-3.5" />
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Payment provider
            </p>

            <h3 className="mt-0.5 text-[12px] font-semibold text-neutral-950">
              {payment.provider}
            </h3>
          </div>
        </div>

        <span
          className={`self-start rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${paymentStatusClass(
            payment.status,
          )}`}
        >
          {payment.status.replaceAll(
            "_",
            " ",
          )}
        </span>
      </div>

      {/* Transaction + refunds */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <section className="rounded border border-neutral-200 bg-neutral-50/60 p-4">
          <div className="border-b border-neutral-200 pb-3">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Transaction
            </p>

            <h3 className="mt-1 text-[12px] font-semibold text-neutral-950">
              Payment details
            </h3>
          </div>

          <dl className="mt-3 divide-y divide-neutral-200/80">
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
              label="Capture / transaction ID"
              value={
                payment.transactionReference ??
                payment.providerPaymentId ??
                "—"
              }
            />

            <Detail
              label="Provider order ID"
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
                  emphasized
                />
              )}
          </dl>
        </section>

        <section className="rounded border border-neutral-200 p-4">
          <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
              <RotateCcw className="h-3 w-3" />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Refunds
              </p>

              <h3 className="mt-0.5 text-[12px] font-semibold text-neutral-950">
                Refund history
              </h3>
            </div>
          </div>

          {(payment.refunds ?? [])
            .length === 0 ? (
            <div className="py-5 text-center">
              <p className="text-[10px] text-neutral-500">
                No refunds have been
                recorded.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {(payment.refunds ?? []).map(
                (refund) => (
                  <div
                    key={refund.id}
                    className="py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold tabular-nums text-neutral-950">
                          {
                            refund.currency
                          }{" "}
                          {refund.amount}
                        </p>

                        <p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-neutral-500">
                          {refund.reason.replaceAll(
                            "_",
                            " ",
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${refundStatusClass(
                          refund.status,
                        )}`}
                      >
                        {refund.status}
                      </span>
                    </div>

                    {refund.adminNote && (
                      <p className="mt-2 text-[10px] leading-4 text-neutral-500">
                        {
                          refund.adminNote
                        }
                      </p>
                    )}

                    {refund.providerRefundId && (
                      <p className="mt-2 break-all font-mono text-[9px] leading-4 text-neutral-400">
                        Provider refund:{" "}
                        {
                          refund.providerRefundId
                        }
                      </p>
                    )}

                    <p className="mt-1.5 text-[9px] text-neutral-400">
                      {formatDate(
                        refund.createdAt,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>

      {/* Refund action */}
      {canRefund(payment) && (
        <section className="mt-5 border-t border-neutral-200 pt-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-red-500">
              Financial action
            </p>

            <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
              Issue refund
            </h3>

            <p className="mt-1 max-w-2xl text-[10px] leading-4 text-neutral-500">
              Refunds are sent through{" "}
              {payment.provider}.
              Inventory and order status
              are not changed
              automatically.
            </p>
          </div>

          <div className="mt-4 max-w-2xl rounded border border-red-100 bg-red-50/20 p-4">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setRefundMode(
                    "FULL",
                  )
                }
                className={`min-h-9 rounded border px-3 py-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  refundMode === "FULL"
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                Full remaining
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  setRefundMode(
                    "PARTIAL",
                  )
                }
                className={`min-h-9 rounded border px-3 py-2 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  refundMode ===
                  "PARTIAL"
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                }`}
              >
                Partial refund
              </button>
            </div>

            {refundMode ===
              "PARTIAL" && (
              <div className="mt-4">
                <label className="text-[10px] font-medium text-neutral-700">
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
                      event.target
                        .value,
                    )
                  }
                  className={`${inputClass} mt-1.5`}
                  placeholder="0.00"
                />

                {remaining !==
                  null && (
                  <p className="mt-1.5 text-[9px] text-neutral-500">
                    Maximum refundable
                    balance:{" "}
                    <span className="font-semibold text-neutral-700">
                      {payCurrency
                        ? `${payCurrency} `
                        : ""}
                      {remaining.toFixed(
                        2,
                      )}
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="mt-4">
              <label className="text-[10px] font-medium text-neutral-700">
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
                className={`${inputClass} mt-1.5`}
              >
                {refundReasons.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="mt-4">
              <label className="text-[10px] font-medium text-neutral-700">
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
                    event.target
                      .value,
                  )
                }
                className={`${inputClass} mt-1.5 min-h-20 resize-y`}
                placeholder="Internal note about this refund..."
              />
            </div>

            {error && (
              <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2.5">
                <p className="text-[10px] font-medium leading-4 text-red-700">
                  {error}
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-4 border-t border-red-100 pt-4">
              <p className="hidden max-w-sm text-[9px] leading-4 text-neutral-500 sm:block">
                A confirmation is
                required before the
                provider refund request
                is sent.
              </p>

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
        </section>
      )}
    </AdminCard>
  );
}

function Detail({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-[10px] leading-4 text-neutral-500">
        {label}
      </dt>

      <dd
        className={`max-w-[60%] break-all text-right text-[10px] leading-4 ${
          emphasized
            ? "font-semibold text-neutral-950"
            : "font-medium text-neutral-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}