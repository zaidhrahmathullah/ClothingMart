import Link from "next/link";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  isWishlisted?: boolean;
};

function getDiscountPercentage(
  regularPrice: string,
  effectivePrice: string,
) {
  const regular = Number(regularPrice);
  const effective = Number(effectivePrice);

  if (
    !Number.isFinite(regular) ||
    !Number.isFinite(effective) ||
    regular <= 0 ||
    effective >= regular
  ) {
    return null;
  }

  return Math.round(
    ((regular - effective) / regular) * 100,
  );
}

export default function ProductCard({
  product,
  isWishlisted = false,
}: ProductCardProps) {
  const image = product.images[0];

  const cheapestVariant = product.variants.reduce<
    Product["variants"][number] | null
  >((cheapest, variant) => {
    if (
      !cheapest ||
      Number(variant.effectivePrice) <
        Number(cheapest.effectivePrice)
    ) {
      return variant;
    }

    return cheapest;
  }, null);

  const discountPercentage =
    cheapestVariant?.hasDiscount
      ? getDiscountPercentage(
          cheapestVariant.price,
          cheapestVariant.effectivePrice,
        )
      : null;

  return (
    <article className="group">
      <div className="relative">
        <Link
          href={`/product/${product.slug}`}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded bg-neutral-100">
            {image ? (
              <img
                src={image.imageUrl}
                alt={image.altText ?? product.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                No image
              </div>
            )}

            <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
              {discountPercentage !== null && (
                <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold leading-none text-white">
                  -{discountPercentage}%
                </span>
              )}

              {product.isNew && (
                <span className="rounded bg-white/95 px-2 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-neutral-900">
                  New
                </span>
              )}
            </div>

            {!product.inStock && (
              <div className="absolute inset-x-2.5 bottom-2.5 rounded bg-neutral-950/85 px-2.5 py-1.5 text-center text-[11px] font-medium text-white backdrop-blur-sm">
                Out of stock
              </div>
            )}
          </div>
        </Link>

        <div className="absolute right-2.5 top-2.5 z-10">
          <WishlistButton
            productId={product.id}
            initialWishlisted={isWishlisted}
          />
        </div>
      </div>

      <div className="pt-2.5">
        <Link
          href={`/product/${product.slug}`}
          className="block"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">
            {product.category.name}
          </p>

          <h2 className="mt-1 line-clamp-1 text-[13px] font-medium text-neutral-950 transition-colors group-hover:text-neutral-600">
            {product.name}
          </h2>
        </Link>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="text-xs font-semibold text-neutral-950">
            {product.variants.length > 1 && "From "}
            LKR {product.startingPrice}
          </span>

          {cheapestVariant?.hasDiscount && (
            <span className="text-[11px] text-neutral-400 line-through">
              LKR {cheapestVariant.price}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}