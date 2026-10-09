"use client";

import Link from "next/link";
import {
  ChevronDown,
  ShoppingBag,
} from "lucide-react";
import { useState } from "react";

import type { Category } from "@/types/category";

type Props = {
  categories: Category[];
};

export default function ShopMenu({
  categories,
}: Props) {
  const [open, setOpen] = useState(false);

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        onFocus={openMenu}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 py-[18px] text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none"
      >
        Shop

        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-1/2 top-full z-50
            w-[min(90vw,920px)]
            -translate-x-1/2
            pt-1.5
          "
        >
          <div className="overflow-hidden rounded border border-neutral-200 bg-white shadow-lg">
            <div className="p-5">
              <div className="mb-4 flex items-end justify-between border-b border-neutral-100 pb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Collections
                  </p>

                  <p className="mt-1 text-[13px] text-neutral-500">
                    Explore our categories
                  </p>
                </div>

                <Link
                  href="/shop"
                  onClick={closeMenu}
                  className="text-[13px] font-semibold text-neutral-700 transition-colors hover:text-neutral-950"
                >
                  Shop All
                </Link>
              </div>

              {categories.length > 0 ? (
                <div
                  className="
                    grid gap-x-7 gap-y-6
                    sm:grid-cols-2
                    lg:grid-cols-4
                  "
                >
                  {categories.map(
                    (category) => (
                      <div
                        key={category.id}
                        className="min-w-0"
                      >
                        <Link
                          href={`/shop/category/${category.slug}`}
                          onClick={closeMenu}
                          className="inline-block text-[13px] font-semibold text-neutral-950 transition-colors hover:text-neutral-600"
                        >
                          {category.name}
                        </Link>

                        {(category.children ??
                          []).length > 0 && (
                          <div className="mt-2 space-y-0.5">
                            {(
                              category.children ??
                              []
                            ).map(
                              (child) => (
                                <Link
                                  key={
                                    child.id
                                  }
                                  href={`/shop/category/${child.slug}`}
                                  onClick={
                                    closeMenu
                                  }
                                  className="block py-1 text-[13px] text-neutral-500 transition-colors hover:text-neutral-950"
                                >
                                  {
                                    child.name
                                  }
                                </Link>
                              ),
                            )}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="py-5 text-[13px] text-neutral-500">
                  No collections are
                  available yet.
                </p>
              )}
            </div>

            <div className="border-t border-neutral-100 bg-neutral-50/70 px-5 py-3">
              <Link
                href="/shop"
                onClick={closeMenu}
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-neutral-950 transition-opacity hover:opacity-65"
              >
                <ShoppingBag
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                View All Products
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}