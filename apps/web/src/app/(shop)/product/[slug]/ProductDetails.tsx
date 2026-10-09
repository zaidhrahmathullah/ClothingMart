"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReviewSection from "@/features/reviews/components/ReviewForm";

import type {
  Product,
  ProductVariant,
} from "@/types/product";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  getLoginHref,
  isAuthenticationError,
} from "@/lib/auth-navigation";

import { addCartItem } from "@/services/cart";

import {
  useCart,
} from "@/features/cart/context/CartContext";

import WishlistButton from "@/features/wishlist/components/WishlistButton";

import {
  useNotification,
} from "@/components/feedback/NotificationProvider";

type ProductDetailsProps = {
  product: Product;
};

function getColorValue(color: string) {
  const values: Record<string, string> = {
    black: "#171717",
    white: "#ffffff",
    grey: "#a3a3a3",
    gray: "#a3a3a3",
    red: "#dc2626",
    blue: "#2563eb",
    navy: "#1e3a5f",
    green: "#15803d",
    olive: "#657153",
    yellow: "#eab308",
    orange: "#ea580c",
    pink: "#ec4899",
    purple: "#9333ea",
    brown: "#795548",
    beige: "#d6c6a5",
    cream: "#f5f0df",
  };

  return values[color.trim().toLowerCase()] ?? "#d4d4d4";
}

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

export default function ProductDetails({
  product,
}: ProductDetailsProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { setCart } = useCart();

  const notification = useNotification();

  const sortedImages = useMemo(
    () =>
      [...product.images].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    [product.images],
  );

  const [selectedImageId, setSelectedImageId] =
    useState<string | null>(
      sortedImages[0]?.id ?? null,
    );

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  const [quantity, setQuantity] = useState(1);

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const sizes = Array.from(
    new Set(
      product.variants.map(
        (variant) => variant.size,
      ),
    ),
  ).sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
    }),
  );

  const colors = Array.from(
    new Set(
      product.variants.map(
        (variant) => variant.color,
      ),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const selectedVariant:
    | ProductVariant
    | undefined = product.variants.find(
    (variant) =>
      variant.size === selectedSize &&
      variant.color === selectedColor,
  );

  const selectedImage =
    sortedImages.find(
      (image) => image.id === selectedImageId,
    ) ?? sortedImages[0];

  const selectedImageIndex = Math.max(
    0,
    sortedImages.findIndex(
      (image) => image.id === selectedImage?.id,
    ),
  );

  function selectImageAt(index: number) {
    const image = sortedImages[index];

    if (image) {
      setSelectedImageId(image.id);
    }
  }

  function showPreviousImage() {
    if (sortedImages.length > 1) {
      selectImageAt(
        (selectedImageIndex -
          1 +
          sortedImages.length) %
          sortedImages.length,
      );
    }
  }

  function showNextImage() {
    if (sortedImages.length > 1) {
      selectImageAt(
        (selectedImageIndex + 1) %
          sortedImages.length,
      );
    }
  }

  const availableQuantity =
    selectedVariant?.stockQuantity ?? 0;

  /*
   * IMPORTANT:
   * Use effectivePrice here rather than the regular
   * variant price. This keeps the displayed total
   * consistent with discounted cart/order pricing.
   */
  const totalPrice = selectedVariant
    ? Number(selectedVariant.effectivePrice) *
      quantity
    : 0;

  const discountPercentage =
    selectedVariant?.hasDiscount
      ? getDiscountPercentage(
          selectedVariant.price,
          selectedVariant.effectivePrice,
        )
      : null;

  const isVariantAvailable = Boolean(
    selectedVariant?.inStock &&
      availableQuantity > 0,
  );

  const addToCartLabel = isAddingToCart
    ? "Adding to cart..."
    : !selectedSize
      ? "Select a size"
      : !selectedColor
        ? "Select a colour"
        : !isVariantAvailable
          ? "Out of stock"
          : "Add to cart";

  function handleSizeChange(size: string) {
    setSelectedSize(size);

    /*
     * Reset colour because the available colours can
     * differ between sizes.
     */
    setSelectedColor("");
    setQuantity(1);
  }

  function handleColorChange(color: string) {
    const exists = product.variants.some(
      (variant) =>
        variant.size === selectedSize &&
        variant.color === color,
    );

    setSelectedColor(exists ? color : "");
    setQuantity(1);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  }

  function increaseQuantity() {
    if (!isVariantAvailable) return;

    setQuantity((current) =>
      Math.min(
        availableQuantity,
        current + 1,
      ),
    );
  }

  async function handleAddToCart() {
    
    if (!selectedSize) {
      notification.warning(
        "Choose a size before adding this item to your cart.",
        "Select a size",
      );
      return;
    }

    if (!selectedColor) {
      notification.warning(
        "Choose an available colour for this size.",
        "Select a colour",
      );
      return;
    }

    if (
      !selectedVariant ||
      !isVariantAvailable
    ) {
      notification.warning(
        "This size and colour combination is currently out of stock.",
        "Variant unavailable",
      );
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity >
        selectedVariant.stockQuantity
    ) {
      notification.warning(
        "Choose a quantity that is currently available.",
        "Check quantity",
      );
      return;
    }

    try {
      setIsAddingToCart(true);

      const updatedCart =
        await addCartItem({
          variantId:
            selectedVariant.id,
          quantity,
        });

      setCart(updatedCart);

      notification.success(
        `${product.name} was added to your cart.`,
        "Added to cart",
      );
    } catch (error) {
      if (isAuthenticationError(error)) {
        router.push(getLoginHref(pathname));
        return;
      }

      notification.error(
        error instanceof Error
          ? error.message
          : "Unable to add this product to your cart.",
        "Could not add to cart",
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto grid max-w-[1040px] items-start gap-10 lg:grid-cols-[430px_minmax(0,520px)] xl:gap-14">
        {/* Product Gallery */}
        <section className="w-full max-w-[430px]">
          <div className="group relative aspect-[3/4] overflow-hidden rounded border border-neutral-300 bg-neutral-100">
            {selectedImage ? (
              <img
                src={selectedImage.imageUrl}
                alt={
                  selectedImage.altText ??
                  product.name
                }
                className="h-full w-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-neutral-400">
                No image available
              </div>
            )}

            {sortedImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous product image"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-white/90 text-neutral-950 opacity-100 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronLeft
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  aria-label="Next product image"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded bg-white/90 text-neutral-950 opacity-100 shadow-sm backdrop-blur transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronRight
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}
          </div>

          {/* Gallery thumbnails */}
          {sortedImages.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {sortedImages.map(
                (image, index) => {
                  const isSelected =
                    image.id ===
                    selectedImage?.id;

                  return (
                    <button
                      key={image.id}
                      type="button"
                      aria-label={`View product image ${
                        index + 1
                      }`}
                      aria-pressed={
                        isSelected
                      }
                      onClick={() =>
                        setSelectedImageId(
                          image.id,
                        )
                      }
                      className={`aspect-[3/4] overflow-hidden rounded border transition-colors ${
                        isSelected
                          ? "border-neutral-950"
                          : "border-neutral-200 hover:border-neutral-500"
                      }`}
                    >
                      <img
                        src={
                          image.imageUrl
                        }
                        alt={
                          image.altText ??
                          product.name
                        }
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* Product Information */}
        <section className="w-full lg:self-start">
          {/* Category / New */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              {product.category.name}
            </p>

            {product.isNew && (
              <span className="rounded bg-neutral-950 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                New
              </span>
            )}
          </div>

          {/* Product name + wishlist */}
          <div className="mt-3 flex items-start justify-between gap-5">
            <h1 className="max-w-xl text-2xl font-medium leading-tight tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              {product.name}
            </h1>

            <div className="shrink-0">
              <WishlistButton
                productId={product.id}
              />
            </div>
          </div>

          {/* Price */}
          <div className="mt-4">
            {selectedVariant ? (
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                <span className="text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                  LKR{" "}
                  {
                    selectedVariant.effectivePrice
                  }
                </span>

                {selectedVariant.hasDiscount && (
                  <>
                    <span className="text-sm text-neutral-400 line-through">
                      LKR{" "}
                      {
                        selectedVariant.price
                      }
                    </span>

                    {discountPercentage !==
                      null && (
                      <span className="rounded bg-red-600 px-2 py-1 text-[10px] font-semibold text-white">
                        -
                        {
                          discountPercentage
                        }
                        %
                      </span>
                    )}
                  </>
                )}
              </div>
            ) : (
              <p className="text-xl font-semibold tracking-[-0.02em] text-neutral-950">
                From LKR{" "}
                {product.startingPrice}
              </p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <p className="mt-5 max-w-xl text-[13px] leading-6 text-neutral-600">
              {product.description}
            </p>
          )}

          <div className="my-6 border-t border-neutral-200" />

          {/* Size Selection */}
          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[13px] font-semibold text-neutral-950">
                Select Size
              </h2>

              {selectedSize && (
                <span className="text-[11px] text-neutral-500">
                  Selected:{" "}
                  {selectedSize}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {sizes.map((size) => {
                const isSelected =
                  selectedSize === size;

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      handleSizeChange(
                        size,
                      )
                    }
                    aria-pressed={
                      isSelected
                    }
                    className={`min-w-10 rounded border px-3 py-2 text-xs font-semibold transition-colors ${
                      isSelected
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colour Selection */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-[13px] font-semibold text-neutral-950">
                Select Colour
              </h2>

              {selectedColor && (
                <span className="text-[11px] text-neutral-500">
                  Selected:{" "}
                  {selectedColor}
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {colors.map((color) => {
                const matchingVariant =
                  product.variants.find(
                    (variant) =>
                      variant.size ===
                        selectedSize &&
                      variant.color ===
                        color,
                  );

                const isSelected =
                  selectedColor === color;

                const isSoldOut =
                  Boolean(
                    matchingVariant &&
                      !matchingVariant.inStock,
                  );

                return (
                  <button
                    key={color}
                    type="button"
                    disabled={
                      !selectedSize ||
                      !matchingVariant
                    }
                    onClick={() =>
                      handleColorChange(
                        color,
                      )
                    }
                    aria-pressed={
                      isSelected
                    }
                    title={
                      !selectedSize
                        ? "Select a size first"
                        : !matchingVariant
                          ? "Not available in this size"
                          : matchingVariant.inStock
                            ? color
                            : "Out of stock"
                    }
                    className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-neutral-950 bg-neutral-950 text-white"
                        : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    <span
                      aria-hidden="true"
                      className={`relative h-4 w-4 shrink-0 rounded-full border border-black/15 ring-1 ${
                        isSelected
                          ? "ring-white/60"
                          : "ring-transparent"
                      }`}
                      style={{
                        backgroundColor:
                          getColorValue(
                            color,
                          ),
                      }}
                    >
                      {isSoldOut && (
                        <span className="absolute left-1/2 top-1/2 h-px w-5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-500" />
                      )}
                    </span>

                    <span>
                      {color}
                    </span>

                    {isSoldOut && (
                      <span className="text-[10px] opacity-70">
                        Sold out
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {!selectedSize && (
              <p className="mt-2 text-[11px] text-neutral-500">
                Choose a size to see
                its available colours.
              </p>
            )}
          </div>

          {/* Availability */}
          <div
            className="mt-5"
            aria-live="polite"
          >
            {selectedVariant ? (
              isVariantAvailable ? (
                <div className="flex items-center gap-2 text-xs font-medium text-green-700">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-green-600"
                  />

                  <span>
                    In stock —{" "}
                    {
                      availableQuantity
                    }{" "}
                    available
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-red-600"
                  />

                  <span>
                    This variant is
                    currently out of
                    stock.
                  </span>
                </div>
              )
            ) : (
              <p className="text-xs text-neutral-500">
                {!selectedSize
                  ? "Select a size to continue."
                  : "Select a colour to complete your selection."}
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-6">
            <h2 className="text-[13px] font-semibold text-neutral-950">
              Quantity
            </h2>

            <div className="mt-2.5 flex h-9 w-fit items-center overflow-hidden rounded border border-neutral-300 bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={
                  decreaseQuantity
                }
                disabled={
                  !isVariantAvailable ||
                  quantity <= 1
                }
                className="flex h-full w-9 items-center justify-center text-base text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="flex w-9 justify-center text-xs font-semibold text-neutral-950">
                {quantity}
              </span>

              <button
                type="button"
                aria-label="Increase quantity"
                onClick={
                  increaseQuantity
                }
                disabled={
                  !isVariantAvailable ||
                  quantity >=
                    availableQuantity
                }
                className="flex h-full w-9 items-center justify-center text-base text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          {isVariantAvailable && (
            <div className="mt-6 flex items-center justify-between gap-6 border-y border-neutral-200 py-3.5">
              <div>
                <p className="text-xs text-neutral-500">
                  Total
                </p>

                {quantity > 1 && (
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    LKR{" "}
                    {
                      selectedVariant
                        ?.effectivePrice
                    }{" "}
                    × {quantity}
                  </p>
                )}
              </div>

              <span className="text-lg font-semibold text-neutral-950">
                LKR{" "}
                {totalPrice.toFixed(
                  2,
                )}
              </span>
            </div>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            disabled={
              !isVariantAvailable ||
              isAddingToCart
            }
            onClick={handleAddToCart}
            className="mt-5 w-full rounded bg-neutral-950 px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {addToCartLabel}
          </button>
        </section>
      </div>

      <ReviewSection
        productId={product.id}
      />
    </main>
  );
}