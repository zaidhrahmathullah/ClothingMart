import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { serverApiFetch } from "@/lib/server-api";

import type { Order } from "@/types/order";

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  let order: Order;

  try {
    order =
      await serverApiFetch<Order>(
        `/orders/${id}`,
      );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      redirect("/login");
    }

    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 lg:py-16">
      <Link
        href="/orders"
        className="text-sm font-semibold text-neutral-600 hover:text-neutral-950"
      >
        ← Back to Orders
      </Link>

      <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-500">
            Order Details
          </p>

          <h1 className="mt-3 break-all text-2xl font-bold">
            {order.id}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            {new Date(
              order.createdAt,
            ).toLocaleString()}
          </p>
        </div>

        <span className="w-fit rounded-full bg-neutral-100 px-4 py-2 text-xs font-bold uppercase">
          {order.status}
        </span>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-8">
          <div className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-bold">
              Items
            </h2>

            <div className="mt-6 divide-y divide-neutral-200">
              {order.items.map(
                (item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-6 py-5"
                  >
                    <div>
                      <p className="font-semibold">
                        {
                          item.productName
                        }
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        {
                          item.variantDescription
                        }
                      </p>

                      <p className="mt-1 text-sm text-neutral-500">
                        Qty:{" "}
                        {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold">
                      LKR{" "}
                      {item.subtotal}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-lg font-bold">
              Shipping Address
            </h2>

            <div className="mt-5 text-sm leading-7 text-neutral-600">
              <p className="font-semibold text-neutral-950">
                {
                  order.shippingAddress
                    .fullName
                }
              </p>

              <p>
                {
                  order.shippingAddress
                    .phone
                }
              </p>

              <p className="mt-2">
                {
                  order.shippingAddress
                    .addressLine1
                }
              </p>

              {order.shippingAddress
                .addressLine2 && (
                <p>
                  {
                    order.shippingAddress
                      .addressLine2
                  }
                </p>
              )}

              <p>
                {
                  order.shippingAddress
                    .city
                }
                ,{" "}
                {
                  order.shippingAddress
                    .district
                }
              </p>

              <p>
                {
                  order.shippingAddress
                    .postalCode
                }
              </p>

              <p>
                {
                  order.shippingAddress
                    .country
                }
              </p>
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-neutral-200 p-6">
          <h2 className="text-lg font-bold">
            Order Summary
          </h2>

          <div className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-500">
                Subtotal
              </span>

              <span>
                LKR {order.subtotal}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-500">
                Shipping
              </span>

              <span>
                LKR{" "}
                {order.shippingFee}
              </span>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="flex justify-between">
                <span className="font-semibold">
                  Total
                </span>

                <span className="text-xl font-bold">
                  LKR {order.total}
                </span>
              </div>
            </div>
          </div>

          {order.payment && (
            <div className="mt-6 rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Payment
              </p>

              <p className="mt-2 text-sm font-semibold">
                {order.payment.status}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Provider:{" "}
                {order.payment.provider}
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}