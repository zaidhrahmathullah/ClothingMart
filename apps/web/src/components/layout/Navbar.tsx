import Link from "next/link";

import Container from "@/components/ui/Container";
import AccountMenu from "@/features/auth/components/AccountMenu";
import ShopMenu from "@/features/categories/components/ShopMenu";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type { Category } from "@/types/category";
import type { Cart } from "@/types/cart";

async function getAuthenticatedUser() {
  try {
    const auth =
      await serverApiFetch<AuthResponse>("/auth/me");

    return auth.user;
  } catch {
    return null;
  }
}

async function getCategories() {
  try {
    return await serverApiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}

async function getCart() {
  try {
    return await serverApiFetch<Cart>("/cart");
  } catch {
    return null;
  }
}

export default async function Navbar() {
  const [user, categories] = await Promise.all([
    getAuthenticatedUser(),
    getCategories(),
  ]);

  const cart = user ? await getCart() : null;
  const cartItemCount = cart?.itemCount ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-bold tracking-[-0.04em] text-neutral-950"
          >
            ClothingMart
          </Link>

          {/* Main Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
            >
              Home
            </Link>

            <ShopMenu categories={categories} />

            <Link
              href="/about"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
            >
              About
            </Link>
          </nav>

          {/* Authentication / Cart */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 sm:block"
                  >
                    Admin
                  </Link>
                )}
                <AccountMenu user={user} />

                <Link
                  href="/cart"
                  className="relative rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Cart

                  {cartItemCount > 0 && (
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-xs font-bold text-neutral-950">
                      {cartItemCount > 99
                        ? "99+"
                        : cartItemCount}
                    </span>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950 sm:block"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}