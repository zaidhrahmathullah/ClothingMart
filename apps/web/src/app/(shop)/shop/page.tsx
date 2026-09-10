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
        limit: 12,
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
      <CategoryGrid categories={categories} />

      <section>
        <Container>
          <div className="py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Collection
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
              All Products
            </h1>

            <p className="mt-3 text-sm text-neutral-600">
              Explore the complete ClothingMart collection.
            </p>
          </div>

          <div className="pb-6">
            <ProductSearch />
          </div>

          <div className="grid gap-10 pb-12 lg:grid-cols-[220px_1fr]">
            <ProductFilters
              categories={categories}
              colors={colors}
            />

            <div>
              <div className="mb-6 flex items-center justify-between gap-4">
                <p className="text-sm text-neutral-500">
                  {pagination.total} products
                </p>

                <ProductSort />
              </div>

              {products.length === 0 ? (
                <div className="py-24 text-center">
                  <h2 className="text-xl font-semibold">
                    No products found
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500">
                    Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
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
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
