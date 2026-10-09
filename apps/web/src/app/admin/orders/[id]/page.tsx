"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Package,
  ReceiptText,
  UserRound,
} from "lucide-react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminOrder,
  OrderStatus,
} from "@/features/admin/admin-types";
import AdminPaymentManagement from "@/features/admin/components/AdminPaymentManagement";
import {
  AdminButton,
  AdminCard,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
} from "@/features/admin/components/AdminPrimitives";

const nextStatuses: Record<
  OrderStatus,
  OrderStatus[]
> = {
  PENDING: [
    "CONFIRMED",
    "CANCELLED",
  ],
  CONFIRMED: [
    "PROCESSING",
    "CANCELLED",
  ],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

function statusClass(
  status: OrderStatus,
) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "SHIPPED":
      return "bg-blue-50 text-blue-700";

    case "CONFIRMED":
    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export default function AdminOrderDetailPage() {
  const params =
    useParams<{ id: string }>();

  const [order, setOrder] =
    useState<AdminOrder | null>(
      null,
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    adminApi
      .order(params.id)
      .then(setOrder)
      .catch((value: unknown) =>
        setError(
          value instanceof Error
            ? value.message
            : "Unable to load order",
        ),
      );
  }, [params.id]);

  async function refreshOrder() {
    const updated =
      await adminApi.order(
        params.id,
      );

    setOrder(updated);
  }

  async function change(
    status: OrderStatus,
  ) {
    setSaving(true);
    setError("");

    try {
      setOrder(
        await adminApi.updateOrderStatus(
          params.id,
          status,
        ),
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to update order",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      eyebrow="Commerce / Orders"
      title="Order details"
      description={
        order
          ? `Order #${order.id
              .slice(0, 8)
              .toUpperCase()} · Placed ${formatDate(
              order.createdAt,
            )}`
          : "Review fulfilment, customer and payment information."
      }
      action={
        <Link
          href="/admin/orders"
          className="inline-flex min-h-9 items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to orders
        </Link>
      }
    >
      {error && (
        <AdminState error>
          {error}
        </AdminState>
      )}

      {!order && !error ? (
        <AdminState>
          Loading order...
        </AdminState>
      ) : (
        order && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid gap-3 md:grid-cols-3">
              <Summary
                icon={ReceiptText}
                label="Order total"
                value={formatMoney(
                  order.total,
                )}
              />

              <Summary
                icon={Package}
                label="Items"
                value={String(
                  order.items.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      item.quantity,
                    0,
                  ),
                )}
              />

              <Summary
                icon={CalendarDays}
                label="Placed"
                value={formatDate(
                  order.createdAt,
                )}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              {/* Purchased items */}
              <AdminCard>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Order
                    </p>

                    <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                      Purchased items
                    </h2>

                    <p className="mt-1 max-w-lg break-all font-mono text-[9px] leading-4 text-neutral-400">
                      {order.id}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusClass(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="divide-y divide-neutral-100">
                  {order.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-neutral-950">
                            {
                              item.productName
                            }
                          </p>

                          <p className="mt-1 text-[10px] text-neutral-500">
                            Quantity{" "}
                            <span className="font-medium text-neutral-700">
                              {
                                item.quantity
                              }
                            </span>{" "}
                            ×{" "}
                            {formatMoney(
                              item.unitPrice,
                            )}
                          </p>
                        </div>

                        <p className="shrink-0 text-[11px] font-semibold tabular-nums text-neutral-950">
                          {formatMoney(
                            (
                              Number(
                                item.unitPrice,
                              ) *
                              item.quantity
                            ).toString(),
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                  <span className="text-[11px] font-medium text-neutral-600">
                    Order total
                  </span>

                  <span className="text-[15px] font-semibold tracking-[-0.01em] text-neutral-950 tabular-nums">
                    {formatMoney(
                      order.total,
                    )}
                  </span>
                </div>
              </AdminCard>

              {/* Right rail */}
              <div className="space-y-5">
                {/* Customer */}
                <AdminCard>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-700">
                      <UserRound className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                        Customer
                      </p>

                      <h2 className="mt-0.5 truncate text-[12px] font-semibold text-neutral-950">
                        {order.user.name}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-neutral-100 pt-3">
                    <p className="break-all text-[10px] leading-4 text-neutral-500">
                      {order.user.email}
                    </p>

                    <Link
                      href={`/admin/customers/${order.user.id}`}
                      className="mt-3 inline-flex text-[10px] font-semibold text-neutral-950 hover:underline"
                    >
                      View customer
                      profile →
                    </Link>
                  </div>
                </AdminCard>

                {/* Fulfilment */}
                <AdminCard>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Fulfilment
                  </p>

                  <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                    Update order status
                  </h2>

                  <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                    Only valid next
                    transitions are
                    available.
                  </p>

                  <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.1em] text-neutral-400">
                      Current status
                    </p>

                    <div className="mt-1.5">
                      <span
                        className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusClass(
                          order.status,
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {nextStatuses[
                      order.status
                    ].length === 0 ? (
                      <p className="rounded border border-neutral-200 px-3 py-2.5 text-[10px] leading-4 text-neutral-500">
                        No further status
                        transitions are
                        available.
                      </p>
                    ) : (
                      nextStatuses[
                        order.status
                      ].map(
                        (status) => (
                          <AdminButton
                            key={status}
                            disabled={
                              saving
                            }
                            onClick={() =>
                              change(
                                status,
                              )
                            }
                            variant={
                              status ===
                              "CANCELLED"
                                ? "danger"
                                : "primary"
                            }
                          >
                            {saving
                              ? "Saving..."
                              : status ===
                                  "CANCELLED"
                                ? "Cancel order"
                                : `Move to ${status.toLowerCase()}`}
                          </AdminButton>
                        ),
                      )
                    )}
                  </div>
                </AdminCard>
              </div>
            </div>

            {/* Payments */}
            <section className="border-t border-neutral-200 pt-5">
              <div className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Payments
                </p>

                <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-neutral-950">
                  Payment & refunds
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                  Provider transactions
                  and refund management
                  for this order.
                </p>
              </div>

              <AdminPaymentManagement
                payments={
                  order.payment
                }
                onRefundCompleted={
                  refreshOrder
                }
              />
            </section>
          </div>
        )
      )}
    </AdminPage>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ReceiptText;
  label: string;
  value: string;
}) {
  return (
    <AdminCard>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-700">
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-neutral-400">
            {label}
          </p>

          <p className="mt-1 truncate text-[12px] font-semibold text-neutral-950">
            {value}
          </p>
        </div>
      </div>
    </AdminCard>
  );
}