import {
  LockKeyhole,
  ShoppingBag,
} from "lucide-react";
import Image from "next/image";

import type { Cart } from "@/types/cart";

import PayPalCheckout from "./PayPalCheckout";

type CheckoutSummaryProps = {
  cart: Cart;
  disabled: boolean;
  onCreateClothingMartOrder:
    () => Promise<string>;
  onPaymentSuccess:
    (orderId: string) => void;
  onPaymentError:
    (message: string) => void;
};

export default function CheckoutSummary({
  cart,
  disabled,
  onCreateClothingMartOrder,
  onPaymentSuccess,
  onPaymentError,
}: CheckoutSummaryProps) {
  return (
    <aside className="overflow-hidden rounded border border-neutral-200 bg-white lg:sticky lg:top-24">
      <div className="border-b border-neutral-200 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Checkout
        </p>

        <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
          Order Summary
        </h2>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-500">
          <ShoppingBag className="h-3.5 w-3.5" />

          <span>
            {cart.itemCount}{" "}
            {cart.itemCount === 1
              ? "item"
              : "items"}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3"
            >
              <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                {item.product.imageUrl && (
                  <Image
                    src={
                      item.product.imageUrl
                    }
                    alt={item.product.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-neutral-950">
                  {item.product.name}
                </p>

                <p className="mt-1 text-[10px] text-neutral-500">
                  {item.variant.color} /{" "}
                  {item.variant.size}
                </p>

                <p className="mt-1 text-[10px] text-neutral-400">
                  Qty {item.quantity}
                </p>
              </div>

              <p className="shrink-0 text-[11px] font-medium text-neutral-950">
                LKR {item.subtotal}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4 text-[12px]">
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">
              Subtotal
            </span>

            <span className="font-medium text-neutral-950">
              LKR {cart.subtotal}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">
              Shipping
            </span>

            <span className="font-medium text-neutral-950">
              Free
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-neutral-200 pt-4">
          <span className="text-[13px] font-semibold text-neutral-950">
            Total
          </span>

          <span className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
            LKR {cart.subtotal}
          </span>
        </div>

        <div className="mt-5 border-t border-neutral-200 pt-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            Secure Payment
          </p>

          <PayPalCheckout
            disabled={disabled}
            onCreateClothingMartOrder={
              onCreateClothingMartOrder
            }
            onPaymentSuccess={
              onPaymentSuccess
            }
            onPaymentError={
              onPaymentError
            }
          />
        </div>

        <div className="mt-4 flex items-start gap-2 border-t border-neutral-200 pt-4">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />

          <p className="text-[10px] leading-4 text-neutral-500">
            Your order is confirmed only after
            PayPal successfully completes the
            payment.
          </p>
        </div>
      </div>
    </aside>
  );
}