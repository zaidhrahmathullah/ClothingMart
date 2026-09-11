"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminOrder, OrderStatus } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminCard,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

const nextStatuses: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    adminApi
      .order(params.id)
      .then(setOrder)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load order",
        ),
      );
  }, [params.id]);
  async function change(status: OrderStatus) {
    setSaving(true);
    try {
      setOrder(await adminApi.updateOrderStatus(params.id, status));
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to update order",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <AdminPage
      title="Order details"
      description={order ? `Placed ${formatDate(order.createdAt)}` : undefined}
      action={
        <Link
          href="/admin/orders"
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-950"
        >
          Back to orders
        </Link>
      }
    >
      {error ? (
        <AdminState error>{error}</AdminState>
      ) : !order ? (
        <AdminState>Loading order...</AdminState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <AdminCard>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-neutral-950">{order.id}</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  {order.user.name} · {order.user.email}
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">
                {order.status}
              </span>
            </div>
            <div className="mt-6 divide-y divide-neutral-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-neutral-500">Qty {item.quantity}</p>
                  </div>
                  <p>{formatMoney(item.unitPrice)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 font-semibold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </AdminCard>
          <AdminCard>
            <h2 className="font-semibold text-neutral-950">Update status</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Only the next valid transitions are shown.
            </p>
            <div className="mt-4 space-y-2">
              {nextStatuses[order.status].length === 0 ? (
                <p className="text-sm text-neutral-500">
                  This order is complete.
                </p>
              ) : (
                nextStatuses[order.status].map((status) => (
                  <AdminButton
                    key={status}
                    disabled={saving}
                    onClick={() => change(status)}
                    variant={status === "CANCELLED" ? "danger" : "primary"}
                  >
                    {saving ? "Saving..." : status}
                  </AdminButton>
                ))
              )}
            </div>
            {order.payment && (
              <p className="mt-6 text-sm text-neutral-500">
                Payment: {order.payment.status} via {order.payment.provider}
              </p>
            )}
          </AdminCard>
        </div>
      )}
    </AdminPage>
  );
}
