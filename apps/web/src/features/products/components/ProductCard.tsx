import Link from "next/link";

import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({
  product,
}: ProductCardProps) {
  const image = product.images[0];

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <article>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
          {image ? (
            <img
              src={image.imageUrl}
              alt={
                image.altText ?? product.name
              }
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}

          {product.isNew && (
            <span className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
              NEW
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {product.category.name}
          </p>

          <h2 className="mt-1 font-medium">
            {product.name}
          </h2>

          <p className="mt-2 font-semibold">
            LKR {product.startingPrice}
          </p>
        </div>
      </article>
    </Link>
  );
}