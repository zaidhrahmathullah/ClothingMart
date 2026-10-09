import Link from "next/link";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";
import { serverApiFetch } from "@/lib/server-api";
import type { ProductListResponse } from "@/types/product";

async function getFeaturedProducts() {
  try {
    const result =
      await serverApiFetch<ProductListResponse>(
        "/products?page=1&limit=10&sort=newest",
      );

    return result.products;
  } catch (error) {
    console.error(
      "Unable to load featured products:",
      error,
    );

    return [];
  }
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) {
    return null;
  }

  return (
    <section id="featured" className="py-12 sm:py-14">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Latest arrivals
            </p>

            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Featured pieces
            </h2>

            <p className="mt-2 max-w-lg text-[13px] leading-5 text-neutral-500">
              Explore the latest additions to the ClothingMart collection.
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden border-b border-neutral-400 pb-0.5 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950 sm:inline-flex"
          >
            View all products →
          </Link>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 lg:gap-x-5 lg:gap-y-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}