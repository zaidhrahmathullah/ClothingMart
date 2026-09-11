"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminOrderList, OrderStatus } from "@/features/admin/admin-types";
import {
  AdminButton,
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
export default function AdminOrdersPage() {
  const [data, setData] = useState<AdminOrderList | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [error, setError] = useState("");
  function load() {
    adminApi
      .orders({ search, status, limit: 50 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load orders",
        ),
      );
  }
  useEffect(() => {
    load();
  }, []);
  return (
    <AdminPage
      title="Orders"
      description="Track customer purchases and fulfilment status."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
        className="mb-4 flex flex-col gap-2 sm:flex-row sm:max-w-2xl"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by order ID or email"
          className={inputClass}
        />
        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value as OrderStatus | "")
          }
          className={inputClass}
        >
          {statuses.map((value) => (
            <option key={value || "all"} value={value}>
              {value || "All statuses"}
            </option>
          ))}
        </select>
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {error && <AdminState error>{error}</AdminState>}
      {!data && !error ? (
        <AdminState>Loading orders...</AdminState>
      ) : data && data.orders.length === 0 ? (
        <AdminState>No orders found.</AdminState>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-semibold text-neutral-950 hover:underline"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p>{order.user.name}</p>
                      <p className="text-xs text-neutral-500">
                        {order.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">{formatMoney(order.total)}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </AdminPage>
  );
}
