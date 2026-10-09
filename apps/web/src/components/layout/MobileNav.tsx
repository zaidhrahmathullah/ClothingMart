"use client";

import {
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/services/auth";
import type { Category } from "@/types/category";

type MobileNavProps = {
  categories: Category[];
  isAuthenticated: boolean;
  isAdmin: boolean;
};

export default function MobileNav({
  categories,
  isAuthenticated,
  isAdmin,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function closeMenu() {
    setOpen(false);
    setShopOpen(false);
  }

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();

      closeMenu();

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        aria-expanded={open}
        aria-label={
          open
            ? "Close navigation"
            : "Open navigation"
        }
        className="flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
      >
        {open ? (
          <X
            className="h-[18px] w-[18px]"
            aria-hidden="true"
          />
        ) : (
          <Menu
            className="h-[18px] w-[18px]"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMenu}
            className="fixed inset-0 top-14 z-40 bg-black/20"
          />

          <div className="absolute left-0 right-0 top-14 z-50 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-neutral-200 bg-white shadow-lg">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <nav>
                <Link
                  href="/"
                  onClick={closeMenu}
                  className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                >
                  Home
                </Link>

                <div className="border-b border-neutral-100">
                  <button
                    type="button"
                    onClick={() =>
                      setShopOpen(
                        (value) => !value,
                      )
                    }
                    aria-expanded={shopOpen}
                    className="flex w-full items-center justify-between px-1 py-3 text-left text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                  >
                    Shop

                    <ChevronDown
                      aria-hidden="true"
                      className={`h-4 w-4 transition-transform duration-200 ${
                        shopOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {shopOpen && (
                    <div className="mb-3 ml-1 border-l border-neutral-200 pl-4">
                      <Link
                        href="/shop"
                        onClick={closeMenu}
                        className="block py-2 text-[13px] font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                      >
                        All Products
                      </Link>

                      {categories.map(
                        (category) => (
                          <div
                            key={category.id}
                            className="py-1.5"
                          >
                            <Link
                              href={`/shop/category/${category.slug}`}
                              onClick={
                                closeMenu
                              }
                              className="block py-1 text-[13px] font-medium text-neutral-950"
                            >
                              {
                                category.name
                              }
                            </Link>

                            {(category.children ??
                              []).length >
                              0 && (
                              <div className="mt-1 border-l border-neutral-100 pl-3">
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
                                      className="block py-1.5 text-[13px] text-neutral-500 transition-colors hover:text-neutral-950"
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
                  )}
                </div>

                <Link
                  href="/about"
                  onClick={closeMenu}
                  className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                >
                  About
                </Link>

                {isAuthenticated && (
                  <>
                    <Link
                      href="/account"
                      onClick={closeMenu}
                      className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                    >
                      Account
                    </Link>

                    <Link
                      href="/orders"
                      onClick={closeMenu}
                      className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                    >
                      My Orders
                    </Link>

                    <Link
                      href="/wishlist"
                      onClick={closeMenu}
                      className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                    >
                      Wishlist
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full border-b border-neutral-100 px-1 py-3 text-left text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </>
                )}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className="block border-b border-neutral-100 px-1 py-3 text-sm font-medium text-neutral-950 transition-colors hover:text-neutral-600"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </nav>

              {!isAuthenticated && (
                <div className="mt-4 flex items-center gap-5 pt-1">
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-950"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="rounded border border-neutral-900 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-950 hover:text-white"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}