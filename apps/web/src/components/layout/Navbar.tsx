import Link from "next/link";

import Container from "@/components/ui/Container";
import AccountMenu from "@/features/auth/components/AccountMenu";
import ShopMenu from "@/features/categories/components/ShopMenu";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type { Category } from "@/types/category";

import MobileNav from "@/components/layout/MobileNav";

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
    return await serverApiFetch<Category[]>(
      "/categories",
    );
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
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="text-[17px] font-semibold tracking-[-0.035em] text-neutral-950"
          >
            ClothingMart
          </Link>

          {/* Main Navigation */}
          <nav className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
            >
              Home
            </Link>

            <ShopMenu categories={categories} />

            <Link
              href="/about"
              className="text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950"
            >
              About
            </Link>
          </nav>

          {/* Account / Cart / Mobile Navigation */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {user ? (
              <>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 md:block"
                  >
                    Admin
                  </Link>
                )}

                <div className="hidden md:block">
                  <AccountMenu user={user} />
                </div>

                <CartButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 md:block"
                >
                  Login
                </Link>

                <Link
                  href="/register"
                  className="hidden rounded border border-neutral-900 px-3.5 py-1.5 text-[13px] font-semibold text-neutral-950 transition-colors hover:bg-neutral-950 hover:text-white md:inline-flex"
                >
                  Register
                </Link>
              </>
            )}

            <MobileNav
              categories={categories}
              isAuthenticated={Boolean(user)}
              isAdmin={user?.role === "ADMIN"}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}