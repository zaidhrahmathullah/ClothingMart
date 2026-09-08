"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";

import type { CartItem as CartItemType } from "@/types/cart";

type CartItemProps = {
  item: CartItemType;
  onUpdateQuantity: (
    itemId: string,
    quantity: number,
  ) => void;
  onRemove: (itemId: string) => void;
  updating?: boolean;
};

export default function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  updating = false,
}: CartItemProps) {
  const maxQuantity = item.variant.stockQuantity;

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
    <article className="flex gap-4 border-b py-6">
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-medium">
                {item.product.name}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {item.variant.color} /{" "}
                {item.variant.size}
              </p>
            </div>

            <p className="font-medium">
              ${item.subtotal}
            </p>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            ${item.unitPrice} each
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={
                updating || item.quantity <= 1
              }
              className="p-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>

            <span className="min-w-8 text-center text-sm">
              {item.quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={
                updating ||
                item.quantity >= maxQuantity
              }
              className="p-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={updating}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-black disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}