export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { getProductBySlug } from "@/services/product";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const image = product.images[0];

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100">
          {image ? (
            <img
              src={image.imageUrl}
              alt={
                image.altText ?? product.name
              }
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="py-4">
          <p className="text-sm uppercase tracking-widest text-gray-500">
            {product.category.name}
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {product.name}
          </h1>

          <p className="mt-4 text-2xl font-semibold">
            LKR {product.startingPrice}
          </p>

          {product.description && (
            <p className="mt-6 leading-7 text-gray-600">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <h2 className="font-semibold">
              Available variants
            </h2>

            <div className="mt-4 space-y-3">
              {product.variants.map(
                (variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {variant.color}
                      </p>

                      <p className="text-sm text-gray-500">
                        Size {variant.size}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">
                        LKR {variant.price}
                      </p>

                      <p className="text-xs text-gray-500">
                        {variant.inStock
                          ? `${variant.stockQuantity} available`
                          : "Out of stock"}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!product.inStock}
            className="mt-8 w-full rounded-xl bg-black px-6 py-4 font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {product.inStock
              ? "Add to Cart"
              : "Out of Stock"}
          </button>
        </div>
      </div>
    </main>
  );
}