import {
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import Link from "next/link";

type CartSummaryProps = {
  subtotal: string;
  checkoutDisabled?: boolean;
  checkoutDisabledReason?: string;
};

export default function CartSummary({
  subtotal,
  checkoutDisabled = false,
  checkoutDisabledReason,
}: CartSummaryProps) {
  return (
    <aside className="overflow-hidden rounded border border-neutral-200 bg-white lg:sticky lg:top-24">
      <div className="border-b border-neutral-200 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          Your Order
        </p>

        <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
          Order Summary
        </h2>
      </div>

      <div className="p-5">
        <div className="space-y-3 text-[12px]">
          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">
              Subtotal
            </span>

            <span className="font-medium text-neutral-950">
              LKR {subtotal}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-neutral-500">
              Shipping
            </span>

            <span className="text-right font-medium text-neutral-950">
              Calculated at checkout
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-end justify-between gap-4 border-t border-neutral-200 pt-4">
          <span className="text-[13px] font-semibold text-neutral-950">
            Total
          </span>

          <span className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
            LKR {subtotal}
          </span>
        </div>

        {checkoutDisabled ? (
          <div
            aria-disabled="true"
            className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded bg-neutral-300 px-4 py-2.5 text-center text-xs font-semibold text-white"
          >
            Proceed to Checkout
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        ) : (
          <Link
            href="/checkout"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
          >
            Proceed to Checkout
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        {checkoutDisabled &&
          checkoutDisabledReason && (
            <p
              role="status"
              className="mt-3 text-[11px] leading-4 text-neutral-500"
            >
              {checkoutDisabledReason}
            </p>
          )}

        <div className="mt-5 flex items-start gap-2 border-t border-neutral-200 pt-4">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />

          <p className="text-[10px] leading-4 text-neutral-400">
            Your final shipping cost and
            payment details will be confirmed
            during checkout.
          </p>
        </div>
      </div>
    </aside>
  );
}