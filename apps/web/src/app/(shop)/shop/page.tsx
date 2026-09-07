export const dynamic = "force-dynamic";

import { ProductCard } from "@/features/products/components/ProductCard";
import { getProducts } from "@/services/product";


export default async function ShopPage() {
  const result = await getProducts({
    page: 1,
    limit: 12,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
          ClothingMart
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          Shop
        </h1>

        <p className="mt-3 text-gray-600">
          Discover our latest collection.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {result.pagination.total} products
        </p>
      </div>

      {result.products.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {result.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-xl font-semibold">
            No products found
          </h2>

          <p className="mt-2 text-gray-500">
            Check back soon for new arrivals.
          </p>
        </div>
      )}
    </main>
  );
}