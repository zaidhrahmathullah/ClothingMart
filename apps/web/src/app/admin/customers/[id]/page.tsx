"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminCustomerDetail } from "@/features/admin/admin-types";
import {
  AdminCard,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<AdminCustomerDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .customer(params.id)
      .then(setCustomer)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load customer",
        ),
      );
  }, [params.id]);
  return (
    <AdminPage
      title="Customer details"
      action={
        <Link
          href="/admin/customers"
          className="text-sm font-semibold text-neutral-600 hover:text-neutral-950"
        >
          Back to customers
        </Link>
      }
    >
      {error ? (
        <AdminState error>{error}</AdminState>
      ) : !customer ? (
        <AdminState>Loading customer...</AdminState>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <AdminCard>
            <h2 className="font-semibold text-neutral-950">{customer.name}</h2>
            <p className="mt-1 text-sm text-neutral-500">{customer.email}</p>
            <p className="mt-4 text-sm text-neutral-500">
              Customer since {formatDate(customer.createdAt)}
            </p>
            <h3 className="mt-6 font-semibold">Addresses</h3>
            {customer.addresses.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">
                No saved addresses.
              </p>
            ) : (
              <div className="mt-2 space-y-2 text-sm">
                {customer.addresses.map((address) => (
                  <p key={address.id}>
                    {address.addressLine1}, {address.city}, {address.district}{" "}
                    {address.postalCode}, {address.country}
                  </p>
                ))}
              </div>
            )}
          </AdminCard>
          <AdminCard>
            <h2 className="font-semibold text-neutral-950">Order history</h2>
            {customer.orders.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">No orders yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-neutral-100">
                {customer.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm hover:bg-neutral-50"
                  >
                    <span>
                      <span className="block font-medium">
                        {order.id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-neutral-500">
                        {formatDate(order.createdAt)} · {order.status}
                      </span>
                    </span>
                    <span>{formatMoney(order.total)}</span>
                  </Link>
                ))}
              </div>
            )}
          </AdminCard>
        </div>
      )}
    </AdminPage>
  );
}
