import {
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";

export default function EmptyCart() {
  return (
    <section className="rounded border border-neutral-200 bg-white px-5 py-14 text-center sm:px-6">
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-neutral-100 text-neutral-500">
        <ShoppingBag className="h-[17px] w-[17px]" />
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        Shopping Bag
      </p>

      <h2 className="mt-1.5 text-lg font-medium tracking-[-0.02em] text-neutral-950">
        Your cart is empty
      </h2>

      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-5 text-neutral-500">
        Explore the collection and add a few
        pieces before heading to checkout.
      </p>

      <Link
        href="/shop"
        className="mt-5 inline-flex items-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
      >
        Continue Shopping

        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}