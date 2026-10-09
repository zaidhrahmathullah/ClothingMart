"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  UserRound,
  WalletCards,
} from "lucide-react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminCustomerDetail,
} from "@/features/admin/admin-types";
import {
  AdminCard,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
} from "@/features/admin/components/AdminPrimitives";

function orderStatusClass(
  status: string,
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

export default function AdminCustomerDetailPage() {
  const params =
    useParams<{ id: string }>();

  const [
    customer,
    setCustomer,
  ] =
    useState<AdminCustomerDetail | null>(
      null,
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    adminApi
      .customer(params.id)
      .then(setCustomer)
      .catch((value: unknown) =>
        setError(
          value instanceof Error
            ? value.message
            : "Unable to load customer",
        ),
      );
  }, [params.id]);

  const orderTotal = useMemo(
    () =>
      (
        customer?.orders ?? []
      ).reduce(
        (total, order) =>
          total +
          Number(order.total),
        0,
      ),
    [customer],
  );

  return (
    <AdminPage
      eyebrow="Customers"
      title={
        customer
          ? customer.name
          : "Customer details"
      }
      description={
        customer
          ? `${customer.email} · Customer since ${formatDate(
              customer.createdAt,
            )}`
          : "Review customer account information and order history."
      }
      action={
        <Link
          href="/admin/customers"
          className="inline-flex min-h-9 items-center gap-2 rounded border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to customers
        </Link>
      }
    >
      {error ? (
        <AdminState error>
          {error}
        </AdminState>
      ) : !customer ? (
        <AdminState>
          Loading customer...
        </AdminState>
      ) : (
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary
              icon={Package}
              label="Orders"
              value={String(
                customer.orders.length,
              )}
            />

            <Summary
              icon={WalletCards}
              label="Order value"
              value={formatMoney(
                orderTotal.toString(),
              )}
            />

            <Summary
              icon={MapPin}
              label="Saved addresses"
              value={String(
                customer.addresses
                  .length,
              )}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            {/* Customer information */}
            <div className="space-y-5">
              <AdminCard>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
                    <UserRound className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Customer account
                    </p>

                    <h2 className="mt-0.5 truncate text-[13px] font-semibold text-neutral-950">
                      {customer.name}
                    </h2>
                  </div>
                </div>

                <p className="mt-3 break-all text-[10px] leading-4 text-neutral-500">
                  {customer.email}
                </p>

                <dl className="mt-4 divide-y divide-neutral-100 border-t border-neutral-200">
                  <Detail
                    label="Role"
                    value={customer.role}
                  />

                  <Detail
                    label="Joined"
                    value={formatDate(
                      customer.createdAt,
                    )}
                  />

                  <Detail
                    label="Last updated"
                    value={formatDate(
                      customer.updatedAt,
                    )}
                  />
                </dl>
              </AdminCard>

              {/* Addresses */}
              <AdminCard>
                <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
                    <MapPin className="h-3 w-3" />
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                      Delivery
                    </p>

                    <h2 className="mt-0.5 text-[12px] font-semibold text-neutral-950">
                      Saved addresses
                    </h2>
                  </div>
                </div>

                {customer.addresses
                  .length === 0 ? (
                  <p className="py-4 text-[10px] text-neutral-500">
                    No saved addresses.
                  </p>
                ) : (
                  <div className="divide-y divide-neutral-100">
                    {customer.addresses.map(
                      (
                        address,
                        index,
                      ) => (
                        <div
                          key={
                            address.id
                          }
                          className="py-3"
                        >
                          <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
                            Address{" "}
                            {index + 1}
                          </p>

                          <div className="mt-1.5 text-[10px] leading-4 text-neutral-600">
                            <p>
                              {
                                address.addressLine1
                              }
                            </p>

                            <p>
                              {
                                address.city
                              }
                              ,{" "}
                              {
                                address.district
                              }
                            </p>

                            <p>
                              {
                                address.postalCode
                              }
                              {address.country
                                ? ` · ${address.country}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </AdminCard>
            </div>

            {/* Order history */}
            <AdminCard>
              <div className="flex flex-col gap-2 border-b border-neutral-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Commerce history
                  </p>

                  <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
                    Orders
                  </h2>

                  <p className="mt-1 text-[10px] leading-4 text-neutral-500">
                    Orders associated
                    with this customer
                    account.
                  </p>
                </div>

                <p className="text-[10px] text-neutral-400">
                  {
                    customer.orders
                      .length
                  }{" "}
                  {customer.orders
                    .length === 1
                    ? "order"
                    : "orders"}
                </p>
              </div>

              {customer.orders
                .length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-[11px] font-semibold text-neutral-700">
                    No orders yet
                  </p>

                  <p className="mt-1 text-[10px] text-neutral-500">
                    This customer has
                    not placed an order.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {customer.orders.map(
                    (order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="grid gap-3 py-3.5 transition-colors hover:bg-neutral-50/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-neutral-950">
                            #
                            {order.id
                              .slice(
                                0,
                                8,
                              )
                              .toUpperCase()}
                          </p>

                          <p className="mt-0.5 text-[9px] text-neutral-500">
                            {formatDate(
                              order.createdAt,
                            )}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <span
                            className={`inline-flex rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${orderStatusClass(
                              order.status,
                            )}`}
                          >
                            {
                              order.status
                            }
                          </span>

                          <span className="min-w-24 text-right text-[11px] font-semibold tabular-nums text-neutral-950">
                            {formatMoney(
                              order.total,
                            )}
                          </span>
                        </div>
                      </Link>
                    ),
                  )}
                </div>
              )}
            </AdminCard>
          </div>
        </div>
      )}
    </AdminPage>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Package;
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

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-[10px] leading-4 text-neutral-500">
        {label}
      </dt>

      <dd className="max-w-[60%] break-all text-right text-[10px] font-medium leading-4 text-neutral-900">
        {value}
      </dd>
    </div>
  );
}