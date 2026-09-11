"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminDashboard } from "@/features/admin/admin-types";
import {
  AdminCard,
  AdminLink,
  AdminPage,
  AdminState,
  formatMoney,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load dashboard",
        ),
      );
  }, []);
  return (
    <AdminPage
      title="Dashboard"
      description="A quick view of your store operations."
      action={<AdminLink href="/admin/products/new">Add product</AdminLink>}
    >
      {error ? (
        <AdminState error>{error}</AdminState>
      ) : !data ? (
        <AdminState>Loading dashboard...</AdminState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Active products", data.products],
              ["Customers", data.customers],
              ["Orders", data.orders],
              ["Revenue", formatMoney(data.revenue)],
              ["Low stock", data.lowStock],
            ].map(([label, value]) => (
              <AdminCard key={String(label)}>
                <p className="text-sm text-neutral-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-neutral-950">
                  {value}
                </p>
              </AdminCard>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <AdminCard>
              <h2 className="font-semibold text-neutral-950">Catalogue</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Manage products, variants, and categories.
              </p>
              <div className="mt-4 flex gap-2">
                <AdminLink href="/admin/products">Products</AdminLink>
                <AdminLink href="/admin/categories">Categories</AdminLink>
              </div>
            </AdminCard>
            <AdminCard>
              <h2 className="font-semibold text-neutral-950">Fulfilment</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Review orders and update their status.
              </p>
              <div className="mt-4">
                <AdminLink href="/admin/orders">View orders</AdminLink>
              </div>
            </AdminCard>
            <AdminCard>
              <h2 className="font-semibold text-neutral-950">Inventory</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {data.lowStock} variant{data.lowStock === 1 ? "" : "s"} need
                attention.
              </p>
              <div className="mt-4">
                <AdminLink href="/admin/inventory">Manage stock</AdminLink>
              </div>
            </AdminCard>
          </div>
        </>
      )}
    </AdminPage>
  );
}
