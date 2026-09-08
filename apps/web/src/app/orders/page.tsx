import Link from "next/link";
import { redirect } from "next/navigation";

import { serverApiFetch } from "@/lib/server-api";

import type { Order } from "@/types/order";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  let orders: Order[];

  try {
    orders =
      await serverApiFetch<Order[]>(
        "/orders",
      );
  } catch {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 lg:py-16">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Account
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          My Orders
        </h1>
      </div>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-neutral-200 p-10 text-center">
          <h2 className="text-lg font-bold">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-neutral-500">
            Your completed orders will appear
            here.
          </p>

          <Link
            href="/shop"
            className="mt-6 inline-block rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block rounded-2xl border border-neutral-200 p-6 transition hover:border-neutral-950"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm text-neutral-500">
                    Order
                  </p>

                  <p className="mt-1 font-mono text-sm font-semibold">
                    {order.id}
                  </p>

                  <p className="mt-2 text-sm text-neutral-500">
                    {new Date(
                      order.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="sm:text-right">
                  <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase">
                    {order.status}
                  </span>

                  <p className="mt-3 text-lg font-bold">
                    LKR {order.total}
                  </p>

                  <p className="text-sm text-neutral-500">
                    {order.items.length}{" "}
                    {order.items.length === 1
                      ? "item"
                      : "items"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}