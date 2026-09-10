import Link from "next/link";

import Container from "@/components/ui/Container";
import CategoryProductSection from "@/features/home/CategoryProductSection";
import { serverApiFetch } from "@/lib/server-api";
import type { Category } from "@/types/category";

async function getCategories(): Promise<Category[]> {
  try {
    return await serverApiFetch<Category[]>("/categories");
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategories();

  return (
    <main>
      {/* Keep your existing Hero section here */}

      <section className="border-y border-neutral-200 bg-neutral-50 py-16">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Discover ClothingMart
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
              Curated collections for every style
            </h1>

            <p className="mt-4 text-base leading-7 text-neutral-600">
              Explore our latest collections, carefully selected to
              bring together everyday essentials and modern styles.
            </p>
          </div>
        </Container>
      </section>

      {categories.map((category) => (
        <CategoryProductSection
          key={category.id}
          category={category}
        />
      ))}

      <section className="py-20">
        <Container>
          <div className="rounded-3xl bg-neutral-950 px-6 py-12 text-center text-white md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              ClothingMart
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
              Find your next favourite piece.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-300">
              Browse the complete collection and discover styles
              selected for you.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
            >
              Explore All Products
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}