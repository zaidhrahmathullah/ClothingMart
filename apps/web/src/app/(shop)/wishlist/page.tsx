import {
  ArrowRight,
  Heart,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import ProductCard from "@/features/products/components/ProductCard";
import { serverApiFetch } from "@/lib/server-api";

import type { AuthResponse } from "@/types/auth";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  let auth: AuthResponse;
  let products: Product[];

  try {
    [auth, products] = await Promise.all([
      serverApiFetch<AuthResponse>(
        "/auth/me",
      ),
      serverApiFetch<Product[]>(
        "/wishlist",
      ),
    ]);
  } catch {
    redirect(
      "/login?next=%2Fwishlist",
    );
  }

  return (
    <AccountShell
      name={auth.user.name}
      email={auth.user.email}
      title="Wishlist"
      description="Keep the pieces you love close by and return whenever you're ready."
    >
      <div className="space-y-6">
        {/* Wishlist overview */}
        <section className="rounded border border-neutral-200 bg-white">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-950 text-white">
                <Heart className="h-[17px] w-[17px]" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Saved Collection
                </p>

                <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                  {products.length}{" "}
                  {products.length === 1
                    ? "piece"
                    : "pieces"}{" "}
                  saved
                </h2>

                <p className="mt-1.5 max-w-lg text-[13px] leading-5 text-neutral-500">
                  Your favourites stay
                  together here so you can
                  easily return to them.
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              className="inline-flex w-fit shrink-0 items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              Continue Shopping

              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {products.length === 0 ? (
          <section className="rounded border border-neutral-200 bg-white px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-neutral-100 text-neutral-500">
              <Heart className="h-[17px] w-[17px]" />
            </div>

            <h2 className="mt-4 text-sm font-semibold text-neutral-950">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-neutral-500">
              Browse the collection and select the
              heart on any product you want to save
              for later.
            </p>

            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Explore Products
            </Link>
          </section>
        ) : (
          <section className="rounded border border-neutral-200 bg-white">
            <div className="flex flex-col gap-2 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Your Favourites
                </p>

                <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                  Saved Products
                </h2>
              </div>

              <p className="text-[11px] text-neutral-500">
                {products.length}{" "}
                {products.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5 xl:grid-cols-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </AccountShell>
  );
}