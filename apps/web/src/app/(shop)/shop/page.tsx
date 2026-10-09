import Link from "next/link";

import Container from "@/components/ui/Container";

import CategoryGrid from "@/features/categories/components/CategoryGrid";
import ProductCard from "@/features/products/components/ProductCard";
import ProductFilters from "@/features/products/components/ProductFilters";
import ProductPagination from "@/features/products/components/ProductPagination";
import ProductSearch from "@/features/products/components/ProductSearch";
import ProductSort from "@/features/products/components/ProductSort";

import { getCategories } from "@/services/category";
import { getProducts } from "@/services/product";

type ShopPageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

export default async function ShopPage({
  searchParams,
}: ShopPageProps) {
  const params = await searchParams;

  const page = Number(params.page ?? "1");

  const [categories, productsResponse] =
    await Promise.all([
      getCategories().catch(() => []),

      getProducts({
        page: Number.isFinite(page)
          ? Math.max(1, page)
          : 1,

        limit: 15,
        search: params.search,
        category: params.category,
        size: params.size,
        color: params.color,

        minPrice: params.minPrice
          ? Number(params.minPrice)
          : undefined,

        maxPrice: params.maxPrice
          ? Number(params.maxPrice)
          : undefined,

        sort: params.sort as
          | "newest"
          | "oldest"
          | "name_asc"
          | "name_desc"
          | "price_asc"
          | "price_desc"
          | undefined,
      }),
    ]);

  const products = productsResponse.products;
  const pagination = productsResponse.pagination;

  const sizes = Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.map(
          (variant) => variant.size,
        ),
      ),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
    }),
  );

  const colors = Array.from(
    new Set(
      products.flatMap((product) =>
        product.variants.map(
          (variant) => variant.color,
        ),
      ),
    ),
  ).sort();

  const hasActiveFilters = Boolean(
    params.search ||
      params.category ||
      params.size ||
      params.color ||
      params.minPrice ||
      params.maxPrice,
  );

  return (
    <main className="bg-white">
      <CategoryGrid categories={categories} />

      <section className="border-t border-neutral-100">
        <Container>
          <div className="border-b border-neutral-200 py-9 sm:py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Collection
                </p>

                <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                  All Products
                </h1>

                <p className="mt-2 text-[13px] leading-5 text-neutral-500">
                  Explore the complete ClothingMart collection.
                </p>
              </div>

              <p className="text-xs text-neutral-500">
                <span className="font-semibold text-neutral-950">
                  {pagination.total}
                </span>{" "}
                {pagination.total === 1
                  ? "product"
                  : "products"}
              </p>
            </div>
          </div>

          <div className="py-6">
            <ProductSearch />
          </div>

          <div className="grid gap-8 pb-12 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]">
            <aside className="lg:border-r lg:border-neutral-200 lg:pr-6">
              <div className="lg:sticky lg:top-28">
                <div className="mb-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                      Refine
                    </p>

                    <h2 className="mt-1 text-sm font-semibold text-neutral-950">
                      Filters
                    </h2>
                  </div>

                  {hasActiveFilters && (
                    <Link
                      href="/shop"
                      className="border-b border-neutral-300 pb-0.5 text-[11px] font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                    >
                      Clear all
                    </Link>
                  )}
                </div>

                <ProductFilters
                  categories={categories}
                  sizes={sizes}
                  colors={colors}
                />
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-800">
                    {pagination.total === 0
                      ? hasActiveFilters
                        ? "No matches found"
                        : "No products available"
                      : `${pagination.total} ${
                          pagination.total === 1
                            ? "product"
                            : "products"
                        } found`}
                  </p>

                  {params.search && (
                    <p className="mt-1 text-[11px] text-neutral-500">
                      Results for &ldquo;
                      {params.search}
                      &rdquo;
                    </p>
                  )}
                </div>

                <div className="sm:shrink-0">
                  <ProductSort />
                </div>
              </div>

              {products.length === 0 ? (
                <div className="border-t border-neutral-200 py-16 text-center">
                  <h2 className="text-base font-semibold text-neutral-950">
                    {hasActiveFilters
                      ? "No matching products"
                      : "No products available"}
                  </h2>

                  <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-neutral-500">
                    {hasActiveFilters
                      ? "We couldn’t find any products matching your current search or filters. Try adjusting them to see more of the collection."
                      : "There aren’t any products available in the shop right now. Please check back soon."}
                  </p>

                  {hasActiveFilters && (
                    <Link
                      href="/shop"
                      className="mt-5 inline-flex rounded border border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-neutral-950"
                    >
                      Clear search & filters
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 xl:grid-cols-5 xl:gap-x-4 xl:gap-y-8">
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>

                  <div className="mt-10 border-t border-neutral-200 pt-7">
                    <ProductPagination
                      currentPage={pagination.page}
                      totalPages={
                        pagination.totalPages
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}