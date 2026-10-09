"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Clock3,
  PackageCheck,
  Search,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminOrderList,
  OrderStatus,
} from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminMetricCard,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

const statuses: (OrderStatus | "")[] = [
  "",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

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

    case "PROCESSING":
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

export default function AdminOrdersPage() {
  const [data, setData] =
    useState<AdminOrderList | null>(
      null,
    );

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState<OrderStatus | "">("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      setData(
        await adminApi.orders({
          search,
          status,
          limit: 50,
        }),
      );
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load orders",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    adminApi
      .orders({
        search: "",
        status: "",
        limit: 50,
      })
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((value: unknown) => {
        if (!cancelled) {
          setError(
            value instanceof Error
              ? value.message
              : "Unable to load orders",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    const orders =
      data?.orders ?? [];

    return {
      loaded: orders.length,

      pending: orders.filter(
        (order) =>
          order.status ===
            "PENDING" ||
          order.status ===
            "CONFIRMED",
      ).length,

      processing: orders.filter(
        (order) =>
          order.status ===
            "PROCESSING" ||
          order.status ===
            "SHIPPED",
      ).length,

      delivered: orders.filter(
        (order) =>
          order.status ===
          "DELIVERED",
      ).length,
    };
  }, [data]);

  return (
    <AdminPage
      eyebrow="Commerce"
      title="Orders"
      description="Review customer purchases, fulfilment progress and payment activity."
    >
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            label="Loaded orders"
            value={summary.loaded}
            icon={ShoppingBag}
          />

          <AdminMetricCard
            label="Awaiting action"
            value={summary.pending}
            icon={Clock3}
          />

          <AdminMetricCard
            label="In fulfilment"
            value={
              summary.processing
            }
            icon={Truck}
          />

          <AdminMetricCard
            label="Delivered"
            value={summary.delivered}
            icon={PackageCheck}
          />
        </div>

        {/* Orders workspace */}
        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Order management
                </p>

                <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                  Customer orders
                </h2>

                <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                  Search purchases and
                  narrow the workspace by
                  fulfilment status.
                </p>
              </div>

              {data && (
                <p className="text-[10px] text-neutral-400">
                  {data.orders.length}{" "}
                  {data.orders.length ===
                  1
                    ? "order"
                    : "orders"}{" "}
                  loaded
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
              className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_190px_auto]"
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search order ID or customer email"
                  className={`${inputClass} pl-9`}
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as
                      | OrderStatus
                      | "",
                  )
                }
                className={inputClass}
              >
                {statuses.map(
                  (value) => (
                    <option
                      key={
                        value || "all"
                      }
                      value={value}
                    >
                      {value
                        ? value.replaceAll(
                            "_",
                            " ",
                          )
                        : "All statuses"}
                    </option>
                  ),
                )}
              </select>

              <AdminButton
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </AdminButton>
            </form>
          </div>

          {error && (
            <div className="p-4 sm:p-5">
              <AdminState error>
                {error}
              </AdminState>
            </div>
          )}

          {!error &&
          loading &&
          !data ? (
            <div className="p-4 sm:p-5">
              <AdminState>
                Loading orders...
              </AdminState>
            </div>
          ) : !error &&
            data &&
            data.orders.length ===
              0 ? (
            <div className="p-4 sm:p-5">
              <AdminState>
                No orders match these
                filters.
              </AdminState>
            </div>
          ) : (
            data && (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-neutral-200 bg-neutral-50/80">
                      <tr className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                        <th className="px-5 py-3">
                          Order
                        </th>

                        <th className="px-4 py-3">
                          Customer
                        </th>

                        <th className="px-4 py-3">
                          Items
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3">
                          Total
                        </th>

                        <th className="px-4 py-3">
                          Placed
                        </th>

                        <th className="px-5 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                      {data.orders.map(
                        (order) => {
                          const itemCount =
                            order.items.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                item.quantity,
                              0,
                            );

                          return (
                            <tr
                              key={
                                order.id
                              }
                              className="transition-colors hover:bg-neutral-50/70"
                            >
                              <td className="px-5 py-3.5">
                                <p className="text-[11px] font-semibold text-neutral-950">
                                  #
                                  {order.id
                                    .slice(
                                      0,
                                      8,
                                    )
                                    .toUpperCase()}
                                </p>

                                <p
                                  className="mt-0.5 max-w-[145px] truncate font-mono text-[9px] text-neutral-400"
                                  title={
                                    order.id
                                  }
                                >
                                  {
                                    order.id
                                  }
                                </p>
                              </td>

                              <td className="px-4 py-3.5">
                                <p className="max-w-[190px] truncate text-[11px] font-medium text-neutral-900">
                                  {
                                    order
                                      .user
                                      .name
                                  }
                                </p>

                                <p className="mt-0.5 max-w-[210px] truncate text-[10px] text-neutral-500">
                                  {
                                    order
                                      .user
                                      .email
                                  }
                                </p>
                              </td>

                              <td className="px-4 py-3.5">
                                <span className="text-[11px] font-medium tabular-nums text-neutral-700">
                                  {
                                    itemCount
                                  }
                                </span>
                              </td>

                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${statusClass(
                                    order.status,
                                  )}`}
                                >
                                  {
                                    order.status
                                  }
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-[11px] font-semibold tabular-nums text-neutral-950">
                                {formatMoney(
                                  order.total,
                                )}
                              </td>

                              <td className="px-4 py-3.5 text-[10px] text-neutral-500">
                                {formatDate(
                                  order.createdAt,
                                )}
                              </td>

                              <td className="px-5 py-3.5 text-right">
                                <Link
                                  href={`/admin/orders/${order.id}`}
                                  className="inline-flex min-h-8 items-center rounded border border-neutral-200 bg-white px-2.5 text-[10px] font-semibold text-neutral-800 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                                >
                                  View order
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                {data.pagination
                  .total >
                  data.orders
                    .length && (
                  <div className="border-t border-neutral-200 px-5 py-3">
                    <p className="text-[10px] text-neutral-500">
                      Showing{" "}
                      {
                        data.orders
                          .length
                      }{" "}
                      of{" "}
                      {
                        data
                          .pagination
                          .total
                      }{" "}
                      matching orders.
                    </p>
                  </div>
                )}
              </>
            )
          )}
        </section>
      </div>
    </AdminPage>
  );
}