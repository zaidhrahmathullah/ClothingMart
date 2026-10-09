"use client";

import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Package,
  Plus,
  ShoppingBag,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { adminApi } from "@/features/admin/admin-api";
import type { AdminDashboard } from "@/features/admin/admin-types";
import {
  AdminCard,
  AdminLink,
  AdminMetricCard,
  AdminPage,
  AdminState,
  formatMoney,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminDashboardPage() {
  const [data, setData] =
    useState<AdminDashboard | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    adminApi
      .dashboard()
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
              : "Unable to load dashboard",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPage
      eyebrow="Overview"
      title="Dashboard"
      description="Store activity, sales and operational status."
      action={
        <AdminLink href="/admin/products/new">
          <Plus className="h-3.5 w-3.5" />
          Add product
        </AdminLink>
      }
    >
      {error ? (
        <AdminState error>
          {error}
        </AdminState>
      ) : !data ? (
        <AdminState>
          Loading dashboard...
        </AdminState>
      ) : (
        <DashboardContent data={data} />
      )}
    </AdminPage>
  );
}

function DashboardContent({
  data,
}: {
  data: AdminDashboard;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          label="Active products"
          value={data.products}
          icon={Package}
          href="/admin/products"
        />

        <AdminMetricCard
          label="Customers"
          value={data.customers}
          icon={Users}
          href="/admin/customers"
        />

        <AdminMetricCard
          label="Orders"
          value={data.orders}
          icon={ShoppingBag}
          href="/admin/orders"
        />

        <AdminMetricCard
          label="Completed revenue"
          value={formatMoney(data.revenue)}
          icon={WalletCards}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <RevenueChart
          values={data.monthlyRevenue}
        />

        <OrderStatusChart
          values={data.orderStatuses}
          total={data.orders}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PaymentStatusChart
          values={data.paymentStatuses}
        />

        <InventoryPanel
          lowStock={data.lowStock}
        />
      </div>

      <AdminCard>
        <div className="border-b border-neutral-200 pb-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Quick Access
          </p>

          <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
            Management
          </h2>

          <p className="mt-1 text-[12px] leading-5 text-neutral-500">
            Common administration areas.
          </p>
        </div>

        <div className="grid gap-x-8 pt-1 md:grid-cols-2">
          <ManagementLink
            href="/admin/products"
            label="Products"
            detail="Catalogue, variants and pricing"
          />

          <ManagementLink
            href="/admin/categories"
            label="Categories"
            detail="Catalogue structure"
          />

          <ManagementLink
            href="/admin/inventory"
            label="Inventory"
            detail="Stock quantities"
          />

          <ManagementLink
            href="/admin/orders"
            label="Orders & payments"
            detail="Fulfilment and refunds"
          />

          <ManagementLink
            href="/admin/customers"
            label="Customers"
            detail="Accounts and order history"
          />

          <ManagementLink
            href="/"
            label="Storefront"
            detail="Open the customer-facing store"
          />
        </div>
      </AdminCard>
    </div>
  );
}

function RevenueChart({
  values,
}: {
  values: AdminDashboard["monthlyRevenue"];
}) {
  const numbers = values.map((item) =>
    Number(item.revenue),
  );

  const maximum = Math.max(
    ...numbers,
    1,
  );

  return (
    <AdminCard>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-neutral-950">
            Completed revenue
          </p>

          <p className="mt-1 text-[11px] text-neutral-500">
            Last six calendar months
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-neutral-500">
          <WalletCards className="h-3.5 w-3.5" />
        </div>
      </div>

      <div className="mt-6 flex h-44 items-end gap-2.5">
        {values.map((item) => {
          const value =
            Number(item.revenue);

          const height =
            value === 0
              ? 2
              : Math.max(
                  (value / maximum) * 100,
                  8,
                );

          return (
            <div
              key={item.label}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex h-32 w-full items-end">
                <div
                  title={`${item.label}: ${formatMoney(
                    item.revenue,
                  )}`}
                  className="w-full rounded-t bg-neutral-900 transition-colors hover:bg-neutral-700"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <p className="mt-2.5 text-[10px] font-medium text-neutral-500">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}

function OrderStatusChart({
  values,
  total,
}: {
  values: AdminDashboard["orderStatuses"];
  total: number;
}) {
  return (
    <AdminCard>
      <div>
        <p className="text-[13px] font-semibold text-neutral-950">
          Order status
        </p>

        <p className="mt-1 text-[11px] text-neutral-500">
          Current order distribution
        </p>
      </div>

      <div className="mt-5 space-y-3.5">
        {values.length === 0 ? (
          <p className="text-[12px] text-neutral-500">
            No orders recorded yet.
          </p>
        ) : (
          values.map((item) => {
            const percentage =
              total > 0
                ? (item.count / total) *
                  100
                : 0;

            return (
              <div key={item.status}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-medium text-neutral-700">
                    {formatStatus(
                      item.status,
                    )}
                  </span>

                  <span className="tabular-nums text-neutral-500">
                    {item.count}
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminCard>
  );
}

function PaymentStatusChart({
  values,
}: {
  values: AdminDashboard["paymentStatuses"];
}) {
  const total = useMemo(
    () =>
      values.reduce(
        (sum, item) =>
          sum + item.count,
        0,
      ),
    [values],
  );

  return (
    <AdminCard>
      <div>
        <p className="text-[13px] font-semibold text-neutral-950">
          Payments
        </p>

        <p className="mt-1 text-[11px] text-neutral-500">
          Payment records by current status
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
        {values.length === 0 ? (
          <p className="col-span-full text-[12px] text-neutral-500">
            No payment records yet.
          </p>
        ) : (
          values.map((item) => (
            <div
              key={item.status}
              className="border-l-2 border-neutral-900 pl-3"
            >
              <p className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                {item.count}
              </p>

              <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
                {formatStatus(
                  item.status,
                )}
              </p>
            </div>
          ))
        )}
      </div>

      <p className="mt-5 border-t border-neutral-100 pt-3.5 text-[11px] text-neutral-500">
        {total} payment{" "}
        {total === 1 ? "record" : "records"}
      </p>
    </AdminCard>
  );
}

function InventoryPanel({
  lowStock,
}: {
  lowStock: number;
}) {
  const needsAttention =
    lowStock > 0;

  return (
    <AdminCard>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
            needsAttention
              ? "bg-amber-50 text-amber-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {needsAttention ? (
            <AlertTriangle className="h-3.5 w-3.5" />
          ) : (
            <Boxes className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-950">
            Inventory
          </p>

          <p className="mt-1 text-[12px] leading-5 text-neutral-500">
            {needsAttention
              ? `${lowStock} stock ${
                  lowStock === 1
                    ? "entry is"
                    : "entries are"
                } at five units or fewer.`
              : "No inventory entries are currently below the low-stock threshold."}
          </p>

          <Link
            href="/admin/inventory"
            className="group mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 transition-colors hover:text-neutral-950"
          >
            Review inventory

            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </AdminCard>
  );
}

function ManagementLink({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[58px] items-center justify-between gap-4 border-b border-neutral-100 py-3"
    >
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-neutral-900 transition-colors group-hover:text-neutral-950">
          {label}
        </p>

        <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
          {detail}
        </p>
      </div>

      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-300 transition-all group-hover:translate-x-0.5 group-hover:text-neutral-700" />
    </Link>
  );
}

function formatStatus(
  value: string,
) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}