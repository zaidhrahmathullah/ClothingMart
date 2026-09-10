"use client";

import Link from "next/link";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { useState } from "react";

import type { Category } from "@/types/category";

type Props = {
  categories: Category[];
};

export default function ShopMenu({
  categories,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
        aria-expanded={open}
      >
        Shop

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-1/2 top-full z-50 mt-4 w-72 -translate-x-1/2 rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400">
                Collections
              </p>
            </div>

            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/category/${category.slug}`}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                <span>{category.name}</span>
              </Link>
            ))}

            <div className="my-2 border-t border-neutral-100" />

            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-neutral-950 px-3 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <ShoppingBag className="h-4 w-4" />

              All Products
            </Link>
          </div>
        </>
      )}
    </div>
  );
}