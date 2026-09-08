"use client";

import { useMemo, useState } from "react";

import type {
  Product,
  ProductVariant,
} from "@/types/product";

import { addCartItem } from "@/services/cart";

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

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants.map(
            (variant) => variant.color,
          ),
        ),
      ),
    [product.variants],
  );

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          product.variants.map(
            (variant) => variant.size,
          ),
        ),
      ),
    [product.variants],
  );

  const firstAvailableVariant =
    product.variants.find(
      (variant) => variant.inStock,
    );

  const [selectedImageId, setSelectedImageId] =
    useState<string | null>(
      sortedImages[0]?.id ?? null,
    );

  const [selectedColor, setSelectedColor] =
    useState<string>(
      firstAvailableVariant?.color ?? "",
    );

  const [selectedSize, setSelectedSize] =
    useState<string>(
      firstAvailableVariant?.size ?? "",
    );

  const [quantity, setQuantity] = useState(1);

  const [isAddingToCart, setIsAddingToCart] =
    useState(false);

  const [cartMessage, setCartMessage] =
    useState<string | null>(null);

  const [cartError, setCartError] =
    useState<string | null>(null);

  const selectedVariant: ProductVariant | undefined =
    product.variants.find(
      (variant) =>
        variant.color === selectedColor &&
        variant.size === selectedSize,
    );

  const selectedImage =
    sortedImages.find(
      (image) => image.id === selectedImageId,
    ) ?? sortedImages[0];

  const availableQuantity =
    selectedVariant?.stockQuantity ?? 0;

  const totalPrice = selectedVariant
    ? Number(selectedVariant.price) * quantity
    : 0;

  const isVariantAvailable =
    Boolean(selectedVariant?.inStock);

  function handleColorChange(color: string) {
    setSelectedColor(color);
    setCartMessage(null);
    setCartError(null);

    const matchingVariant =
      product.variants.find(
        (variant) =>
          variant.color === color &&
          variant.inStock,
      );

    if (matchingVariant) {
      setSelectedSize(matchingVariant.size);
      setQuantity(1);
    }
  }

  function handleSizeChange(size: string) {
    setSelectedSize(size);
    setQuantity(1);
    setCartMessage(null);
    setCartError(null);
  }

  function isColorAvailable(color: string) {
    return product.variants.some(
      (variant) =>
        variant.color === color &&
        variant.inStock,
    );
  }

  function isSizeAvailable(size: string) {
    return product.variants.some(
      (variant) =>
        variant.color === selectedColor &&
        variant.size === size &&
        variant.inStock,
    );
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
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-100">
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

          {/* Color */}
          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-950">
                  Color
                </h2>

                <span className="text-sm text-neutral-500">
                  {selectedColor}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((color) => {
                  const available =
                    isColorAvailable(color);

                  const selected =
                    selectedColor === color;

                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        handleColorChange(color)
                      }
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                      } ${
                        !available
                          ? "cursor-not-allowed opacity-40"
                          : ""
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {sizes.length > 0 && (
            <div className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-950">
                  Size
                </h2>

                <span className="text-sm text-neutral-500">
                  {selectedSize}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const available =
                    isSizeAvailable(size);

                  const selected =
                    selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!available}
                      onClick={() =>
                        handleSizeChange(size)
                      }
                      className={`min-w-14 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? "border-neutral-950 bg-neutral-950 text-white"
                          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                      } ${
                        !available
                          ? "cursor-not-allowed opacity-40"
                          : ""
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
                Select a valid color and size
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
    </main>
  );
}