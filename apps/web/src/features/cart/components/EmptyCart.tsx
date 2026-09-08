import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function EmptyCart() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <ShoppingBag className="h-7 w-7 text-gray-500" />
      </div>

      <h2 className="mt-5 text-xl font-semibold">
        Your cart is empty
      </h2>

      <p className="mt-2 max-w-md text-sm text-gray-500">
        Looks like you haven&apos;t added anything to
        your cart yet.
      </p>

      <Link
        href="/shop"
        className="mt-6 rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        Continue Shopping
      </Link>
    </div>
  );
}