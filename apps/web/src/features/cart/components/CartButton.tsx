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
      aria-label={
        itemCount > 0
          ? `Cart, ${itemCount} ${
              itemCount === 1
                ? "item"
                : "items"
            }`
          : "Cart, empty"
      }
      className="relative rounded bg-neutral-950 px-3.5 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800"
    >
      Cart

      {itemCount > 0 && (
        <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded bg-white px-1 py-0.5 text-[10px] font-bold leading-none text-neutral-950">
          {itemCount > 99
            ? "99+"
            : itemCount}
        </span>
      )}
    </Link>
  );
}