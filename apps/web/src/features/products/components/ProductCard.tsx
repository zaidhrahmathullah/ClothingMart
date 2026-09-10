import Image from "next/image";
import Link from "next/link";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  isWishlisted?: boolean;
};

export default function ProductCard({
  product,
  isWishlisted = false,
}: ProductCardProps) {
  const image = product.images[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
    >
      <article>
        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
          {image ? (
            <img
              src={image.imageUrl}
              alt={
                image.altText ?? product.name
              }
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}
          <div className="absolute right-3 top-3">
            <WishlistButton
              productId={product.id}
              initialWishlisted={isWishlisted}
            />
          </div>
        </div>
        

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-medium text-neutral-950">
              {product.name}
            </h2>

            {product.isNew && (
              <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                New
              </span>
            )}
          </div>

          <p className="mt-2 text-sm font-semibold text-neutral-950">
            LKR {product.startingPrice}
          </p>

          {!product.inStock && (
            <p className="mt-1 text-xs font-medium text-red-600">
              Out of stock
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}