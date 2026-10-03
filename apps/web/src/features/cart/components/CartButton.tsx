"use client";

import Link from "next/link";

import {
  useCart,
} from "@/features/cart/context/CartContext";

export default function CartButton() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      className="relative rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
    >
      Cart

      {itemCount > 0 && (
        <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-neutral-950">
          {itemCount > 99
            ? "99+"
            : itemCount}
        </span>
      )}
    </Link>
  );
}