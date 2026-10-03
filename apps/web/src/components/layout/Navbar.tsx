import Link from "next/link";

import Container from "@/components/ui/Container";
import AccountMenu from "@/features/auth/components/AccountMenu";
import ShopMenu from "@/features/categories/components/ShopMenu";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type { Category } from "@/types/category";


import CartButton from "@/features/cart/components/CartButton";


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


export default async function Navbar() {
  const [user, categories] =
    await Promise.all([
      getAuthenticatedUser(),
      getCategories(),
    ]);

  return (
    <header className="sticky top-0 z-[1000] isolate border-b border-neutral-200/80 bg-white/95 backdrop-blur">
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

                <CartButton />
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