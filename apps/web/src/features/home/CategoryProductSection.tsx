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
        )}&page=1&limit=5&sort=newest`,
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
    <section className="border-t border-neutral-100 py-11 sm:py-12">
      <Container>
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
              Collection
            </p>

            <h2 className="text-2xl font-medium tracking-[-0.025em] text-neutral-950 sm:text-[28px]">
              {category.name}
            </h2>

            {category.description && (
              <p className="mt-1.5 max-w-xl text-[13px] leading-5 text-neutral-500">
                {category.description}
              </p>
            )}
          </div>

          <Link
            href={`/shop/category/${category.slug}`}
            className="hidden shrink-0 border-b border-neutral-400 pb-0.5 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950 sm:inline-flex"
          >
            View All {category.name}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-5 lg:gap-x-5">
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
            className="inline-flex rounded border border-neutral-300 px-4 py-2 text-[13px] font-medium text-neutral-800 transition-colors hover:border-neutral-950"
          >
            View All {category.name}
          </Link>
        </div>
      </Container>
    </section>
  );
}