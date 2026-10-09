import Link from "next/link";

import Container from "@/components/ui/Container";
import CategoryProductSection from "@/features/home/CategoryProductSection";
import FeaturedProducts from "@/features/home/FeaturedProducts";
import Hero from "@/features/home/Hero";
import { serverApiFetch } from "@/lib/server-api";
import type { Category } from "@/types/category";

export const dynamic = "force-dynamic";

async function getCategories(): Promise<Category[]> {
  try {
    return await serverApiFetch<Category[]>("/categories");
  } catch (error) {
    console.error(
      "Unable to load homepage categories:",
      error,
    );

    return [];
  }
}

export default async function HomePage() {
  const categories = await getCategories();

  const mainCategories = categories.filter(
    (category) =>
      category.isActive &&
      category.parentId === null,
  );

  return (
    <>
      <Hero />

      <FeaturedProducts />

      {mainCategories.map((category) => (
        <CategoryProductSection
          key={category.id}
          category={category}
        />
      ))}

      <section className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-20">
        <Container>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                ClothingMart
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                Find your next everyday piece.
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                Browse the full collection across
                men&apos;s, women&apos;s and
                children&apos;s fashion.
              </p>
            </div>

            <Link
              href="/shop"
              className="inline-flex w-fit items-center justify-center rounded-lg bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Shop all products
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}