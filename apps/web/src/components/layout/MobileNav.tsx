"use client";

import {
  Menu,
  X,
} from "lucide-react";

import Link from "next/link";
import { useState } from "react";

type MobileNavProps = {
  isAuthenticated: boolean;
};

export default function MobileNav({
  isAuthenticated,
}: MobileNavProps) {
  const [open, setOpen] =
    useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-label={
          open
            ? "Close navigation"
            : "Open navigation"
        }
        className="rounded-lg p-2 hover:bg-neutral-100"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 border-b border-neutral-200 bg-white p-4 shadow-lg">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium"
            >
              Home
            </Link>

            <Link
              href="/shop"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium"
            >
              Shop
            </Link>

            <Link
              href="/about"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium"
            >
              About
            </Link>

            {isAuthenticated && (
              <Link
                href="/wishlist"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium"
              >
                Wishlist
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}