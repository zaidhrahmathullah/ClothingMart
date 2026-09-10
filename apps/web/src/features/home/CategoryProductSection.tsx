import Link from "next/link";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";
import { serverApiFetch } from "@/lib/server-api";
import type {
  Product,
  ProductListResponse,
} from "@/types/product";
import type { Category } from "@/types/category";

type Props = {
  category: Category;
};

async function getCategoryProducts(
  categorySlug: string,
): Promise<Product[]> {
  try {
    const result =
      await serverApiFetch<ProductListResponse>(
        `/products?category=${encodeURIComponent(
          categorySlug,
        )}&page=1&limit=4&sort=newest`,
      );

    return result.products;
  } catch {
    return [];
  }
}

export default async function CategoryProductSection({
  category,
}: Props) {
  const products = await getCategoryProducts(category.slug);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Collection
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
              {category.name}
            </h2>

            {category.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
                {category.description}
              </p>
            )}
          </div>

          <Link
            href={`/shop/category/${category.slug}`}
            className="hidden rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white sm:inline-flex"
          >
            View All {category.name}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>

        <div className="mt-6 sm:hidden">
          <Link
            href={`/shop/category/${category.slug}`}
            className="inline-flex w-full items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
          >
            View All {category.name}
          </Link>
        </div>
      </Container>
    </section>
  );
}