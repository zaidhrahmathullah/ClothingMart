import { redirect } from "next/navigation";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";
import { serverApiFetch } from "@/lib/server-api";
import type { Product } from "@/types/product";

async function getWishlist(): Promise<Product[]> {
  try {
    return await serverApiFetch<Product[]>(
      "/wishlist",
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "";

    if (
      message.toLowerCase().includes("authentication")
    ) {
      redirect(
        "/login?next=%2Fwishlist",
      );
    }

    throw error;
  }
}

export default async function WishlistPage() {
  const products = await getWishlist();

  return (
    <main>
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Your Collection
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
            Wishlist
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            Save pieces you love and come back to them whenever
            you&apos;re ready.
          </p>
        </Container>
      </section>

      <Container>
        {products.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-2xl font-semibold text-neutral-950">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-500">
              Discover something you love and save it here for
              later.
            </p>

            <a
              href="/shop"
              className="mt-7 inline-flex rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Explore Products
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 py-10 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}