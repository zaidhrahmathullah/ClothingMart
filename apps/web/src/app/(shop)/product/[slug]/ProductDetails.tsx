"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ReviewSection from "@/features/reviews/components/ReviewForm";

import type {
  Product,
  ProductVariant,
} from "@/types/product";

import { addCartItem } from "@/services/cart";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

type ProductDetailsProps = {
  product: Product;
};

export default function ProductDetails({
  product,
}: ProductDetailsProps) {
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

  const [selectedVariantId, setSelectedVariantId] =
    useState("");

  const [quantity, setQuantity] = useState(1);

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const [cartMessage, setCartMessage] =
    useState<string | null>(null);

  const [cartError, setCartError] =
    useState<string | null>(null);

  const selectedVariant: ProductVariant | undefined =
    product.variants.find(
      (variant) => variant.id === selectedVariantId,
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
        (selectedImageIndex - 1 + sortedImages.length) %
          sortedImages.length,
      );
    }
  }

  function showNextImage() {
    if (sortedImages.length > 1) {
      selectImageAt(
        (selectedImageIndex + 1) % sortedImages.length,
      );
    }
  }

  const availableQuantity =
    selectedVariant?.stockQuantity ?? 0;

  const totalPrice = selectedVariant
    ? Number(selectedVariant.price) * quantity
    : 0;

  const isVariantAvailable =
    Boolean(selectedVariant?.inStock);

  function handleVariantChange(variantId: string) {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setCartMessage(null);
    setCartError(null);
  }

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(
        availableQuantity,
        current + 1,
      ),
    );
  }

  async function handleAddToCart() {
    if (!selectedVariant || !isVariantAvailable) {
      return;
    }

    try {
      setIsAddingToCart(true);
      setCartMessage(null);
      setCartError(null);

      await addCartItem({
        variantId: selectedVariant.id,
        quantity,
      });

      setCartMessage(
        "Product added to your cart.",
      );
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to add the product to your cart.",
      );
    } finally {
      setIsAddingToCart(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Product Gallery */}
        <section>
          <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
            {selectedImage ? (
              <img
                src={selectedImage.imageUrl}
                alt={
                  selectedImage.altText ??
                  product.name
                }
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                No image available
              </div>
            )}

            {sortedImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous product image"
                  onClick={showPreviousImage}
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/65 text-white opacity-100 transition hover:bg-neutral-950 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Next product image"
                  onClick={showNextImage}
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-950/65 text-white opacity-100 transition hover:bg-neutral-950 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {sortedImages.map((image) => {
                const isSelected =
                  image.id === selectedImage?.id;

                return (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() =>
                      setSelectedImageId(image.id)
                    }
                    className={`aspect-[3/4] overflow-hidden rounded-lg border-2 ${
                      isSelected
                        ? "border-neutral-950"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={
                        image.altText ??
                        product.name
                      }
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Product Information */}
        <section className="lg:py-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
              {product.category.name}
            </p>

            {product.isNew && (
              <span className="rounded-full bg-neutral-950 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                New
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
            {product.name}
          </h1>
          <WishlistButton
              productId={product.id}
          />

          <p className="mt-4 text-2xl font-semibold text-neutral-950">
            LKR{" "}
            {selectedVariant?.price ??
              product.startingPrice}
          </p>

          {product.description && (
            <p className="mt-6 max-w-xl leading-7 text-neutral-600">
              {product.description}
            </p>
          )}

          <div className="my-8 border-t border-neutral-200" />

          {/* Variant */}
          <div className="mt-7">
            <label
              htmlFor="product-variant"
              className="text-sm font-semibold text-neutral-950"
            >
              Variant
            </label>
            <select
              id="product-variant"
              value={selectedVariantId}
              onChange={(event) =>
                handleVariantChange(event.target.value)
              }
              className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-700 focus:border-neutral-950 focus:outline-none"
            >
              <option value="">Select a variant</option>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.color} / {variant.size}
                  {!variant.inStock ? " (Out of stock)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div className="mt-7">
            {selectedVariant ? (
              selectedVariant.inStock ? (
                <p className="text-sm font-medium text-green-700">
                  {availableQuantity} available
                </p>
              ) : (
                <p className="text-sm font-medium text-red-600">
                  This combination is out of stock
                </p>
              )
            ) : (
              <p className="text-sm font-medium text-neutral-500">
                Select a variant
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="mt-7">
            <h2 className="text-sm font-semibold text-neutral-950">
              Quantity
            </h2>

            <div className="mt-3 flex h-12 w-fit items-center rounded-lg border border-neutral-300">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={
                  !isVariantAvailable ||
                  quantity <= 1
                }
                className="flex h-full w-12 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>

              <span className="flex w-12 justify-center text-sm font-semibold">
                {quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  !isVariantAvailable ||
                  quantity >= availableQuantity
                }
                className="flex h-full w-12 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          {isVariantAvailable && (
            <div className="mt-7 flex items-center justify-between rounded-xl bg-neutral-50 px-5 py-4">
              <span className="text-sm text-neutral-600">
                Total
              </span>

              <span className="text-lg font-bold text-neutral-950">
                LKR {totalPrice.toFixed(2)}
              </span>
            </div>
          )}

          {/* Cart Feedback */}
          {cartMessage && (
            <p className="mt-4 text-sm font-medium text-green-700">
              {cartMessage}
            </p>
          )}

          {cartError && (
            <p className="mt-4 text-sm font-medium text-red-600">
              {cartError}
            </p>
          )}

          {/* Add to Cart */}
          <button
            type="button"
            disabled={
              !isVariantAvailable ||
              isAddingToCart
            }
            onClick={handleAddToCart}
            className="mt-5 w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {isAddingToCart
              ? "Adding..."
              : isVariantAvailable
                ? "Add to Cart"
                : "Unavailable"}
          </button>
        </section>
      </div>
      <ReviewSection
          productId={product.id}
      />
    </main>
  );
}