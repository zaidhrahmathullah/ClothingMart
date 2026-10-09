import {
  ArrowRight,
  Heart,
  MapPin,
  Package,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import { serverApiFetch } from "@/lib/server-api";

import type { Address } from "@/types/address";
import type { AuthResponse } from "@/types/auth";
import type { Order } from "@/types/order";
import type { Product } from "@/types/product";

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

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function getOrderStatusClasses(
  status: Order["status"],
) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "SHIPPED":
      return "bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    case "CONFIRMED":
      return "bg-violet-50 text-violet-700";

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

export default async function AccountPage() {
  let auth: AuthResponse;

  try {
    auth =
      await serverApiFetch<AuthResponse>(
        "/auth/me",
      );
  } catch {
    redirect("/login?next=%2Faccount");
  }

  const { user } = auth;

  /*
   * These sections should never prevent the
   * customer from opening their account page.
   *
   * If one secondary request fails, its section
   * simply falls back to an empty state.
   */
  const [
    ordersResult,
    addressesResult,
    wishlistResult,
  ] = await Promise.allSettled([
    serverApiFetch<Order[]>("/orders"),
    serverApiFetch<Address[]>("/addresses"),
    serverApiFetch<Product[]>("/wishlist"),
  ]);

  const orders =
    ordersResult.status === "fulfilled"
      ? ordersResult.value
      : [];

  const addresses =
    addressesResult.status === "fulfilled"
      ? addressesResult.value
      : [];

  const wishlist =
    wishlistResult.status === "fulfilled"
      ? wishlistResult.value
      : [];

  const recentOrders = orders.slice(0, 3);

  const latestAddress = addresses[0] ?? null;

  const totalSpent = orders
    .filter(
      (order) =>
        order.status !== "CANCELLED",
    )
    .reduce(
      (total, order) =>
        total + Number(order.total || 0),
      0,
    );

  const overviewCards = [
    {
      label: "Orders",
      value: orders.length.toString(),
      detail:
        orders.length === 1
          ? "order placed"
          : "orders placed",
      href: "/orders",
      icon: Package,
    },
    {
      label: "Saved Addresses",
      value: addresses.length.toString(),
      detail:
        addresses.length === 1
          ? "saved address"
          : "saved addresses",
      href: "/account/addresses",
      icon: MapPin,
    },
    {
      label: "Wishlist",
      value: wishlist.length.toString(),
      detail:
        wishlist.length === 1
          ? "saved item"
          : "saved items",
      href: "/wishlist",
      icon: Heart,
    },
  ];

  return (
    <AccountShell
      name={user.name}
      email={user.email}
      title={`Welcome back, ${getFirstName(
        user.name,
      )}.`}
      description="Manage your orders, saved addresses, wishlist and personal details from one place."
    >
      <div className="space-y-7">
        {/* Account introduction */}
        <section className="rounded border border-neutral-200 bg-white">
          <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
            <div className="max-w-xl">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-neutral-950 text-white">
                <UserRound
                  aria-hidden="true"
                  className="h-[17px] w-[17px]"
                />
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Account Overview
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.025em] text-neutral-950 sm:text-2xl">
                Hello, {getFirstName(user.name)}
              </h2>

              <p className="mt-2 max-w-lg text-[13px] leading-5 text-neutral-500">
                Everything connected to your
                ClothingMart account is available
                here.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Continue Shopping

              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
            </Link>
          </div>
        </section>

        {/* Account statistics */}
        <section className="grid overflow-hidden rounded border border-neutral-200 bg-white sm:grid-cols-3">
          {overviewCards.map(
            (card, index) => {
              const Icon = card.icon;

              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className={`group p-5 transition-colors hover:bg-neutral-50 sm:p-6 ${
                    index !==
                    overviewCards.length - 1
                      ? "border-b border-neutral-200 sm:border-b-0 sm:border-r"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px] text-neutral-400 transition-colors group-hover:text-neutral-950"
                    />

                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-neutral-950"
                    />
                  </div>

                  <p className="mt-6 text-2xl font-medium tracking-[-0.03em] text-neutral-950">
                    {card.value}
                  </p>

                  <p className="mt-1 text-[13px] font-semibold text-neutral-950">
                    {card.label}
                  </p>

                  <p className="mt-0.5 text-[11px] text-neutral-500">
                    {card.detail}
                  </p>
                </Link>
              );
            },
          )}
        </section>

        {/* Recent orders */}
        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="flex items-end justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Activity
              </p>

              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                Recent Orders
              </h2>
            </div>

            {orders.length > 0 && (
              <Link
                href="/orders"
                className="inline-flex items-center gap-1.5 border-b border-neutral-300 pb-0.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
              >
                View all

                <ArrowRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
              </Link>
            )}
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-12 text-center sm:px-6">
              <ShoppingBag
                aria-hidden="true"
                className="mx-auto h-5 w-5 text-neutral-400"
              />

              <h3 className="mt-3 text-sm font-semibold text-neutral-950">
                No orders yet
              </h3>

              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-neutral-500">
                Once you place an order, you can
                follow its progress from your
                account.
              </p>

              <Link
                href="/shop"
                className="mt-5 inline-flex rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group grid gap-4 px-5 py-4 transition-colors hover:bg-neutral-50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-neutral-950">
                        Order #
                        {order.id.slice(-8)}
                      </p>

                      <span
                        className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] ${getOrderStatusClasses(
                          order.status,
                        )}`}
                      >
                        {formatStatusLabel(order.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-neutral-500">
                      {formatDate(
                        order.createdAt,
                      )}
                    </p>
                  </div>

                  <p className="text-[13px] font-semibold text-neutral-950">
                    {formatCurrency(
                      order.total,
                    )}
                  </p>

                  <ArrowRight
                    aria-hidden="true"
                    className="hidden h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-neutral-950 sm:block"
                  />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Account details */}
        <div className="grid gap-5 xl:grid-cols-2">
          {/* Saved address */}
          <section className="overflow-hidden rounded border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Delivery
                  </p>

                  <h2 className="mt-1 text-base font-medium text-neutral-950">
                    Saved Address
                  </h2>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100">
                  <MapPin
                    aria-hidden="true"
                    className="h-[17px] w-[17px] text-neutral-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-5">
              {latestAddress ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-950">
                        {latestAddress.label}
                      </p>

                      <p className="mt-2 text-[13px] leading-5 text-neutral-500">
                        {latestAddress.fullName}
                        <br />
                        {
                          latestAddress.addressLine1
                        }
                        {latestAddress.addressLine2
                          ? `, ${latestAddress.addressLine2}`
                          : ""}
                        <br />
                        {latestAddress.city},{" "}
                        {latestAddress.district}
                        <br />
                        {
                          latestAddress.postalCode
                        }
                        , {latestAddress.country}
                      </p>
                    </div>

                    {latestAddress.isDefault && (
                      <span className="rounded bg-neutral-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-neutral-600">
                        Default
                      </span>
                    )}
                  </div>

                  <Link
                    href="/account/addresses"
                    className="mt-5 inline-flex items-center gap-1.5 border-b border-neutral-300 pb-0.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                  >
                    Manage addresses

                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[13px] leading-5 text-neutral-500">
                    You haven&apos;t saved a
                    delivery address yet.
                  </p>

                  <Link
                    href="/account/addresses"
                    className="mt-4 inline-flex rounded border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                  >
                    Add an address
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* Shopping summary */}
          <section className="overflow-hidden rounded border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Account
                  </p>

                  <h2 className="mt-1 text-base font-medium text-neutral-950">
                    Shopping Summary
                  </h2>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100">
                  <ShoppingBag
                    aria-hidden="true"
                    className="h-[17px] w-[17px] text-neutral-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-4">
                <span className="text-[13px] text-neutral-500">
                  Total spent
                </span>

                <span className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                  {formatCurrency(
                    totalSpent.toString(),
                  )}
                </span>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <span className="text-[13px] text-neutral-500">
                  Wishlist
                </span>

                <span className="text-sm font-semibold text-neutral-950">
                  {wishlist.length}{" "}
                  {wishlist.length === 1
                    ? "item"
                    : "items"}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href="/wishlist"
                  className="inline-flex items-center gap-1.5 border-b border-neutral-300 pb-0.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                >
                  View wishlist

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>

                <Link
                  href="/account/profile"
                  className="inline-flex items-center gap-1.5 border-b border-neutral-300 pb-0.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                >
                  Profile settings

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AccountShell>
  );
}