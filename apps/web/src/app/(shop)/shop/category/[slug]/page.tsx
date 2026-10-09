import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import { notFound } from "next/navigation";

import Container from "@/components/ui/Container";
import ProductCard from "@/features/products/components/ProductCard";
import ProductFilters from "@/features/products/components/ProductFilters";
import ProductPagination from "@/features/products/components/ProductPagination";
import ProductSearch from "@/features/products/components/ProductSearch";
import ProductSort from "@/features/products/components/ProductSort";

import {
  findCategoryBySlug,
  getCategories,
} from "@/services/category";

import {
  getProductFacets,
  getProducts,
} from "@/services/product";

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
    inStock?: string;
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

  const category = findCategoryBySlug(
    categories,
    slug,
  );

  if (!category) {
    notFound();
  }

  /*
   * A category returned directly from getCategories()
   * is a parent category.
   *
   * Otherwise it is one of that parent's children.
   */
  const parentCategory =
    categories.find(
      (item) => item.id === category.id,
    ) ??
    categories.find((item) =>
      item.children?.some(
        (child) => child.id === category.id,
      ),
    ) ??
    null;

  const isParentCategory =
    parentCategory?.id === category.id;

  const subcategories = isParentCategory
    ? category.children ?? []
    : parentCategory?.children ?? [];

  const page = Number(query.page ?? "1");

  const [productsResponse, facets] =
    await Promise.all([
      getProducts({
        page: Number.isFinite(page)
          ? Math.max(1, page)
          : 1,

        limit: 15,

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

        inStock:
          query.inStock === "true"
            ? "true"
            : undefined,

        sort: query.sort as
          | "newest"
          | "oldest"
          | "name_asc"
          | "name_desc"
          | "price_asc"
          | "price_desc"
          | undefined,
      }),

      getProductFacets(slug),
    ]);

  const products = productsResponse.products;
  const pagination = productsResponse.pagination;

  const hasActiveFilters = Boolean(
    query.search ||
      query.size ||
      query.color ||
      query.minPrice ||
      query.maxPrice ||
      query.inStock,
  );

  return (
    <main className="bg-white">
      {/* Category hero */}
      <section className="relative isolate overflow-hidden bg-neutral-950">
        {category.bannerImageUrl ? (
          <>
            <img
              src={category.bannerImageUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 -z-20 h-full w-full object-cover"
            />

            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/15" />

            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800" />

            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </>
        )}

        <Container>
          <div className="flex min-h-[290px] items-end py-9 sm:min-h-[330px] sm:py-11 lg:min-h-[360px]">
            <div className="max-w-2xl">
              <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-white/65"
              >
                <Link
                  href="/"
                  className="transition-colors hover:text-white"
                >
                  Home
                </Link>

                <ChevronRight
                  aria-hidden="true"
                  className="h-3 w-3"
                />

                <Link
                  href="/shop"
                  className="transition-colors hover:text-white"
                >
                  Shop
                </Link>

                {!isParentCategory &&
                  parentCategory && (
                    <>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-3 w-3"
                      />

                      <Link
                        href={`/shop/category/${parentCategory.slug}`}
                        className="transition-colors hover:text-white"
                      >
                        {parentCategory.name}
                      </Link>
                    </>
                  )}

                <ChevronRight
                  aria-hidden="true"
                  className="h-3 w-3"
                />

                <span className="text-white">
                  {category.name}
                </span>
              </nav>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                {isParentCategory
                  ? "Collection"
                  : `${
                      parentCategory?.name ??
                      "Collection"
                    } Collection`}
              </p>

              <h1 className="mt-2 text-3xl font-medium tracking-[-0.035em] text-white sm:text-4xl lg:text-[2.75rem]">
                {category.name}
              </h1>

              {category.description && (
                <p className="mt-3 max-w-xl text-[13px] leading-5 text-white/70 sm:text-sm sm:leading-6">
                  {category.description}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <a
                  href="#products"
                  className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
                >
                  Explore Products

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </a>

                <span className="text-xs font-medium text-white/65">
                  {pagination.total}{" "}
                  {pagination.total === 1
                    ? "product"
                    : "products"}
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Subcategory discovery */}
      {subcategories.length > 0 && (
        <section className="border-b border-neutral-200 bg-neutral-50 py-10 sm:py-12">
          <Container>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {isParentCategory
                    ? "Explore More"
                    : "More In This Collection"}
                </p>

                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                  {isParentCategory
                    ? `Shop ${category.name}`
                    : `Explore ${
                        parentCategory?.name ??
                        "Categories"
                      }`}
                </h2>
              </div>

              {!isParentCategory &&
                parentCategory && (
                  <Link
                    href={`/shop/category/${parentCategory.slug}`}
                    className="inline-flex items-center gap-1.5 border-b border-neutral-400 pb-0.5 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                  >
                    View all{" "}
                    {parentCategory.name}

                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    />
                  </Link>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {subcategories.map(
                (subcategory) => {
                  const isCurrent =
                    subcategory.id === category.id;

                  return (
                    <Link
                      key={subcategory.id}
                      href={`/shop/category/${subcategory.slug}`}
                      aria-current={
                        isCurrent
                          ? "page"
                          : undefined
                      }
                      className={`group relative aspect-[4/3] overflow-hidden rounded border bg-neutral-200 ${
                        isCurrent
                          ? "border-neutral-950"
                          : "border-neutral-200"
                      }`}
                    >
                      {subcategory.cardImageUrl ? (
                        <img
                          src={
                            subcategory.cardImageUrl
                          }
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-200" />
                      )}

                      {subcategory.animationImageUrl && (
                        <img
                          src={
                            subcategory.animationImageUrl
                          }
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-[1.02] group-hover:opacity-100 group-focus-visible:opacity-100"
                        />
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                        {isCurrent && (
                          <span className="mb-2 inline-flex rounded bg-white/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-950">
                            Selected
                          </span>
                        )}

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white sm:text-[15px]">
                              {subcategory.name}
                            </h3>

                            <p className="mt-0.5 hidden text-[11px] text-white/70 sm:block">
                              Explore collection
                            </p>
                          </div>

                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/15 text-white backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-neutral-950">
                            <ArrowRight
                              aria-hidden="true"
                              className="h-3.5 w-3.5"
                            />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          </Container>
        </section>
      )}

      {/* Products */}
      <section
        id="products"
        className="scroll-mt-24"
      >
        <Container>
          <div className="py-10 sm:py-12">
            <div className="mb-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Shop The Collection
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                    {category.name}
                  </h2>

                  <p className="mt-1.5 text-[13px] text-neutral-500">
                    Discover products available in this
                    collection.
                  </p>
                </div>

                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 border-b border-neutral-400 pb-0.5 text-[13px] font-medium text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                >
                  Browse all products

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>
              </div>
            </div>

            <div className="border-y border-neutral-200 py-5">
              <ProductSearch />
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]">
              <aside className="lg:border-r lg:border-neutral-200 lg:pr-6">
                <div className="lg:sticky lg:top-28">
                  <div className="mb-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                        Refine
                      </p>

                      <h3 className="mt-1 text-sm font-semibold text-neutral-950">
                        Filters
                      </h3>
                    </div>

                    {hasActiveFilters && (
                      <Link
                        href={`/shop/category/${slug}`}
                        className="border-b border-neutral-300 pb-0.5 text-[11px] font-medium text-neutral-500 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                      >
                        Clear all
                      </Link>
                    )}
                  </div>

                  <ProductFilters
                    categories={[]}
                    sizes={facets.sizes}
                    colors={facets.colors}
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

                    {query.search && (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Results for &ldquo;
                        {query.search}
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
                        : `No ${category.name} products yet`}
                    </h2>

                    <p className="mx-auto mt-1.5 max-w-md text-[13px] leading-5 text-neutral-500">
                      {hasActiveFilters
                        ? "We couldn’t find any products matching your current search or filters. Try adjusting them or browse the full collection."
                        : `There aren’t any products available in ${category.name} right now. You can explore the rest of the collection instead.`}
                    </p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      {hasActiveFilters && (
                        <Link
                          href={`/shop/category/${slug}`}
                          className="rounded border border-neutral-950 bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-neutral-950"
                        >
                          Clear search & filters
                        </Link>
                      )}

                      <Link
                        href="/shop"
                        className="rounded border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
                      >
                        Browse all products
                      </Link>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 xl:grid-cols-5 xl:gap-x-4 xl:gap-y-8">
                      {products.map(
                        (product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                          />
                        ),
                      )}
                    </div>

                    <div className="mt-10 border-t border-neutral-200 pt-7">
                      <ProductPagination
                        currentPage={
                          pagination.page
                        }
                        totalPages={
                          pagination.totalPages
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}