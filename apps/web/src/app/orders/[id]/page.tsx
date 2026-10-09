import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
} from "lucide-react";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type {
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/types/order";

type OrderDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getOrderStatusClasses(
  status: OrderStatus,
) {
  switch (status) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700";

    case "SHIPPED":
      return "bg-blue-50 text-blue-700";

    case "PROCESSING":
      return "bg-amber-50 text-amber-700";

    case "CONFIRMED":
      return "bg-violet-50 text-violet-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function getPaymentStatusClasses(
  status: PaymentStatus,
) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700";

    case "PROCESSING":
      return "bg-blue-50 text-blue-700";

    case "FAILED":
      return "bg-red-50 text-red-700";

    case "CANCELLED":
      return "bg-neutral-100 text-neutral-600";

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-amber-50 text-amber-700";
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

function getOrderStatusMessage(
  status: OrderStatus,
) {
  switch (status) {
    case "PENDING":
      return "Your order has been placed and is awaiting confirmation.";

    case "CONFIRMED":
      return "Your order has been confirmed and is ready for processing.";

    case "PROCESSING":
      return "Your order is being prepared for delivery.";

    case "SHIPPED":
      return "Your order has left for delivery.";

    case "DELIVERED":
      return "Your order has been delivered.";

    case "CANCELLED":
      return "This order has been cancelled.";

    default:
      return "Follow the latest progress of your order here.";
  }
}

export default async function OrderDetailsPage({
  params,
}: OrderDetailsPageProps) {
  const { id } = await params;

  let auth: AuthResponse;
  let order: Order;

  try {
    [auth, order] = await Promise.all([
      serverApiFetch<AuthResponse>(
        "/auth/me",
      ),
      serverApiFetch<Order>(
        `/orders/${id}`,
      ),
    ]);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.toLowerCase()
        : "";

    if (
      message.includes("authentication")
    ) {
      redirect(
        `/login?next=${encodeURIComponent(
          `/orders/${id}`,
        )}`,
      );
    }

    if (
      message.includes("not found") ||
      message.includes("404")
    ) {
      notFound();
    }

    throw error;
  }

  return (
    <AccountShell
      name={auth.user.name}
      email={auth.user.email}
      eyebrow="Order Details"
      title={`Order #${order.id.slice(-8)}`}
      description={`Placed ${formatDateTime(
        order.createdAt,
      )}`}
    >
      <div className="space-y-6">
        <div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 border-b border-neutral-300 pb-0.5 text-xs font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to orders
          </Link>
        </div>

        {/* Status overview */}
        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="grid sm:grid-cols-2">
            <div className="p-5 sm:border-r sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Order Status
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-neutral-950">
                    Purchase progress
                  </p>
                </div>

                <Package className="h-[18px] w-[18px] text-neutral-400" />
              </div>

              <span
                className={`mt-4 inline-flex rounded px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${getOrderStatusClasses(
                  order.status,
                )}`}
              >
                {formatStatusLabel(order.status)}
              </span>

              <p className="mt-3 max-w-sm text-[11px] leading-5 text-neutral-500">
                {getOrderStatusMessage(
                  order.status,
                )}
              </p>
            </div>

            <div className="border-t border-neutral-200 p-5 sm:border-t-0 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                    Payment
                  </p>

                  <p className="mt-2 text-[13px] font-semibold text-neutral-950">
                    Payment status
                  </p>
                </div>

                <CreditCard className="h-[18px] w-[18px] text-neutral-400" />
              </div>

              {order.payment ? (
                <span
                  className={`mt-4 inline-flex rounded px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] ${getPaymentStatusClasses(
                    order.payment.status,
                  )}`}
                >
                  {formatStatusLabel(
                    order.payment.status,
                  )}
                </span>
              ) : (
                <span className="mt-4 inline-flex rounded bg-neutral-100 px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-neutral-600">
                  Not Available
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <div className="space-y-6">
            {/* Items */}
            <section className="overflow-hidden rounded border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-neutral-500">
                  <ReceiptText className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Purchase
                  </p>

                  <h2 className="mt-0.5 text-[13px] font-semibold text-neutral-950">
                    Order Items
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-neutral-200">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-950">
                        {item.productName}
                      </p>

                      {item.variantDescription && (
                        <p className="mt-1 text-[12px] text-neutral-500">
                          {
                            item.variantDescription
                          }
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-400">
                        <span>
                          Qty: {item.quantity}
                        </span>

                        <span>
                          {formatCurrency(
                            item.unitPrice,
                          )}{" "}
                          each
                        </span>
                      </div>
                    </div>

                    <p className="shrink-0 text-[13px] font-semibold text-neutral-950">
                      {formatCurrency(
                        item.subtotal,
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Shipping */}
            <section className="overflow-hidden rounded border border-neutral-200 bg-white">
              <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4 sm:px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-neutral-500">
                  <MapPin className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Delivery
                  </p>

                  <h2 className="mt-0.5 text-[13px] font-semibold text-neutral-950">
                    Shipping Address
                  </h2>
                </div>
              </div>

              <div className="p-5 text-[13px] leading-5 text-neutral-500 sm:p-6">
                <p className="font-semibold text-neutral-950">
                  {
                    order.shippingAddress
                      .fullName
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
                    order.shippingAddress.city
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
                  ,{" "}
                  {
                    order.shippingAddress
                      .country
                  }
                </p>

                <p className="mt-3 text-neutral-500">
                  {
                    order.shippingAddress.phone
                  }
                </p>
              </div>
            </section>
          </div>

          {/* Summary */}
          <aside className="space-y-5 xl:sticky xl:top-24">
            <section className="overflow-hidden rounded border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Payment
                </p>

                <h2 className="mt-1 text-base font-medium text-neutral-950">
                  Order Summary
                </h2>
              </div>

              <div className="p-5">
                <div className="space-y-3 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Subtotal
                    </span>

                    <span className="font-medium text-neutral-950">
                      {formatCurrency(
                        order.subtotal,
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Shipping
                    </span>

                    <span className="font-medium text-neutral-950">
                      {formatCurrency(
                        order.shippingFee,
                      )}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4 border-t border-neutral-200 pt-4">
                  <span className="text-[13px] font-semibold text-neutral-950">
                    Total
                  </span>

                  <span className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                    {formatCurrency(
                      order.total,
                    )}
                  </span>
                </div>
              </div>
            </section>

            {order.payment && (
              <section className="overflow-hidden rounded border border-neutral-200 bg-white">
                <div className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-neutral-500">
                    <CreditCard className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Transaction
                    </p>

                    <h2 className="mt-0.5 text-[13px] font-semibold text-neutral-950">
                      Payment Details
                    </h2>
                  </div>
                </div>

                <div className="space-y-3 p-5 text-[12px]">
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-500">
                      Provider
                    </span>

                    <span className="font-medium uppercase text-neutral-950">
                      {order.payment.provider}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-neutral-500">
                      Status
                    </span>

                    <span
                      className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] ${getPaymentStatusClasses(
                        order.payment.status,
                      )}`}
                    >
                      {formatStatusLabel(
                        order.payment.status,
                      )}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {order.status === "DELIVERED" && (
              <div className="flex gap-3 rounded border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="mt-0.5 h-[17px] w-[17px] shrink-0 text-emerald-700" />

                <div>
                  <p className="text-[12px] font-semibold text-emerald-900">
                    Order delivered
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-emerald-700">
                    Your order has been delivered successfully.
                  </p>
                </div>
              </div>
            )}

            {order.status === "CANCELLED" && (
              <div className="rounded border border-red-200 bg-red-50 p-4">
                <p className="text-[12px] font-semibold text-red-900">
                  Order cancelled
                </p>

                <p className="mt-1 text-[11px] leading-5 text-red-700">
                  This order will not continue through fulfilment.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </AccountShell>
  );
}