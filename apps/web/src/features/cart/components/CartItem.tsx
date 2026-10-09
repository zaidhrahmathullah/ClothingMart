"use client";

import {
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import Image from "next/image";

import type { CartItem as CartItemType } from "@/types/cart";

type CartItemProps = {
  item: CartItemType;
  onUpdateQuantity: (
    itemId: string,
    quantity: number,
  ) => void;
  onRemove: (itemId: string) => void;
  updating?: boolean;
  isUpdatingThisItem?: boolean;
};

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  updating = false,
  isUpdatingThisItem = false,
}: CartItemProps) {
  const maxQuantity = Math.max(
    0,
    item.variant.stockQuantity,
  );

  const isUnavailable =
    !item.variant.inStock ||
    maxQuantity === 0;

  const exceedsStock =
    item.quantity > maxQuantity;

  const decreaseQuantity = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(
        item.id,
        item.quantity - 1,
      );
    }
  };

  const increaseQuantity = () => {
    if (item.quantity < maxQuantity) {
      onUpdateQuantity(
        item.id,
        item.quantity + 1,
      );
    }
  };

  return (
    <article className="p-5 sm:p-6">
      <div className="flex gap-4 sm:gap-5">
        <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100 sm:w-24">
          {item.product.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-neutral-400">
              No image
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-neutral-950">
                {item.product.name}
              </h3>

              <p className="mt-1 text-[11px] text-neutral-500">
                {item.variant.color} /{" "}
                {item.variant.size}
              </p>

              <p className="mt-2 text-[11px] text-neutral-400">
                LKR {item.unitPrice} each
              </p>
            </div>

            <p className="shrink-0 text-[13px] font-semibold text-neutral-950">
              LKR {item.subtotal}
            </p>
          </div>

          {isUnavailable ? (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-4 text-red-700">
              Currently out of stock. Please
              remove this item.
            </div>
          ) : exceedsStock ? (
            <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
              Only {maxQuantity} available.
              Please reduce your quantity.
            </div>
          ) : (
            <p className="mt-3 text-[11px] text-neutral-400">
              {maxQuantity} available
            </p>
          )}

          {isUpdatingThisItem && (
            <p
              role="status"
              className="mt-3 text-[10px] font-medium text-neutral-500"
            >
              Updating your cart...
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center overflow-hidden rounded border border-neutral-300 bg-white">
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={
                  updating ||
                  item.quantity <= 1
                }
                className="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>

              <span className="flex h-8 min-w-9 items-center justify-center border-x border-neutral-300 px-2 text-xs font-medium text-neutral-950">
                {item.quantity}
              </span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  updating ||
                  isUnavailable ||
                  item.quantity >=
                    maxQuantity
                }
                className="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                onRemove(item.id)
              }
              disabled={updating}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />

              {isUpdatingThisItem
                ? "Updating..."
                : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}