import { notFound } from "next/navigation";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";
import ProductFilters from "@/features/products/components/ProductFilters";
import ProductPagination from "@/features/products/components/ProductPagination";
import ProductSearch from "@/features/products/components/ProductSearch";
import ProductSort from "@/features/products/components/ProductSort";
import { getCategories } from "@/services/category";
import { getProducts } from "@/services/product";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<{
    page?: string;
    search?: string;
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const query = await searchParams;

  const categories = await getCategories();

  const category = categories.find(
    (item) => item.slug === slug,
  );

  if (!category) {
    notFound();
  }

  const page = Number(query.page ?? "1");

  const productsResponse = await getProducts({
    page: Number.isFinite(page)
      ? Math.max(1, page)
      : 1,
    limit: 12,
    search: query.search,
    category: slug,
    size: query.size,
    color: query.color,
    minPrice: query.minPrice
      ? Number(query.minPrice)
      : undefined,
    maxPrice: query.maxPrice
      ? Number(query.maxPrice)
      : undefined,
    sort: query.sort as
      | "newest"
      | "oldest"
      | "name_asc"
      | "name_desc"
      | "price_asc"
      | "price_desc"
      | undefined,
  });

  const products = productsResponse.products;
  const pagination = productsResponse.pagination;

  const colors = Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.map(
          (variant) => variant.color,
        ),
      ),
    ),
  ).sort();

  return (
    <main>
      <section className="border-b border-neutral-200 bg-neutral-50 py-14">
        <Container>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Collection
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950 md:text-5xl">
            {category.name}
          </h1>

          {category.description && (
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
              {category.description}
            </p>
          )}
        </Container>
      </section>

      <Container>
        <div className="py-10 lg:py-16">
          <div className="mt-0">
            <ProductSearch />
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
            <ProductFilters
              categories={[]}
              colors={colors}
            />

            <section>
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm text-neutral-500">
                  {pagination.total} products
                </p>

                <ProductSort />
              </div>

              {products.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 px-6 py-20 text-center">
                  <h2 className="text-xl font-semibold text-neutral-950">
                    No products found
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Try changing your filters or browse the full collection.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 py-0 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>

                  <ProductPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                  />
                </>
              )}
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
