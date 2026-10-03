
import Link from "next/link";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";

import { serverApiFetch } from "@/lib/server-api";

import type { ProductListResponse } from "@/types/product";

async function getFeaturedProducts() {
  try {
    const result =
      await serverApiFetch<ProductListResponse>(
        "/products?page=1&limit=4&sort=newest",
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
    <section className="border-y border-neutral-200 bg-neutral-50 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Selected for you
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
              Featured pieces
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-sm font-semibold text-neutral-950 underline underline-offset-4"
          >
            Shop all products
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
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
