import {
  ArrowRight,
  CalendarDays,
  Package,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type {
  Order,
  OrderStatus,
} from "@/types/order";

export const dynamic = "force-dynamic";

function formatCurrency(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `LKR ${value}`;
  }

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusClasses(
  status: OrderStatus,
) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";

    case "SHIPPED":
      return "bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    case "CONFIRMED":
      return "bg-violet-50 text-violet-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function formatStatusLabel(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}


export default async function OrdersPage() {
  let auth: AuthResponse;
  let orders: Order[];

  try {
    [auth, orders] = await Promise.all([
      serverApiFetch<AuthResponse>(
        "/auth/me",
      ),
      serverApiFetch<Order[]>("/orders"),
    ]);
  } catch {
    redirect(
      "/login?next=%2Forders",
    );
  }

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "DELIVERED" &&
      order.status !== "CANCELLED",
  ).length;

  const deliveredOrders = orders.filter(
    (order) =>
      order.status === "DELIVERED",
  ).length;

  const overview = [
    {
      label: "Total Orders",
      value: orders.length,
      detail: "Your complete history",
      icon: Package,
    },
    {
      label: "In Progress",
      value: activeOrders,
      detail: "Orders still on the way",
      icon: ShoppingBag,
    },
    {
      label: "Delivered",
      value: deliveredOrders,
      detail: "Completed deliveries",
      icon: CalendarDays,
    },
  ];

  return (
    <AccountShell
      name={auth.user.name}
      email={auth.user.email}
      title="My Orders"
      description="Follow your purchases from confirmation through delivery and revisit your complete order history."
    >
      <div className="space-y-6">
        {orders.length > 0 && (
          <section className="grid overflow-hidden rounded border border-neutral-200 bg-white sm:grid-cols-3">
            {overview.map(
              (item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className={`p-5 sm:p-6 ${
                      index !==
                      overview.length - 1
                        ? "border-b border-neutral-200 sm:border-b-0 sm:border-r"
                        : ""
                    }`}
                  >
                    <Icon className="h-[18px] w-[18px] text-neutral-400" />

                    <p className="mt-6 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                      {item.value}
                    </p>

                    <p className="mt-1 text-[13px] font-semibold text-neutral-950">
                      {item.label}
                    </p>

                    <p className="mt-0.5 text-[11px] text-neutral-500">
                      {item.detail}
                    </p>
                  </div>
                );
              },
            )}
          </section>
        )}

        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Order History
              </p>

              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                Your Purchases
              </h2>
            </div>

            {orders.length > 0 && (
              <p className="text-[11px] text-neutral-500">
                {orders.length}{" "}
                {orders.length === 1
                  ? "order"
                  : "orders"}
              </p>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-neutral-100 text-neutral-500">
                <ShoppingBag className="h-[17px] w-[17px]" />
              </div>

              <h2 className="mt-4 text-sm font-semibold text-neutral-950">
                No orders yet
              </h2>

              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-neutral-500">
                Once you place your first
                ClothingMart order, you&apos;ll
                be able to follow it here.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-flex items-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                Start Shopping

                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group block px-5 py-5 transition-colors hover:bg-neutral-50 sm:px-6"
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-[13px] font-semibold text-neutral-950">
                          #
                          {order.id.slice(-8)}
                        </p>

                        <span
                          className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] ${getStatusClasses(
                            order.status,
                          )}`}
                        >
                          {formatStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
                        <span>
                          {formatDate(
                            order.createdAt,
                          )}
                        </span>

                        <span>
                          {order.items.length}{" "}
                          {order.items.length ===
                          1
                            ? "item"
                            : "items"}
                        </span>

                        {order.payment && (
                          <span>
                            Payment:{" "}
                            {formatStatusLabel(
                              order.payment.status,
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                      <div className="sm:text-right">
                        <p className="text-[10px] uppercase tracking-[0.08em] text-neutral-400">
                          Total
                        </p>

                        <p className="mt-0.5 text-[13px] font-semibold text-neutral-950">
                          {formatCurrency(
                            order.total,
                          )}
                        </p>
                      </div>

                      <ArrowRight className="h-3.5 w-3.5 text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-950" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AccountShell>
  );
}