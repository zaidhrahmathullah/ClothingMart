"use client";

import { useState } from "react";

import type { Cart } from "@/types/cart";
import {
  clearCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cart";

import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

type CartClientProps = {
  initialCart: Cart;
};

export default function CartClient({
  initialCart,
}: CartClientProps) {
  const [cart, setCart] =
    useState<Cart>(initialCart);

  const [updatingItemId, setUpdatingItemId] =
    useState<string | null>(null);

  const [clearing, setClearing] =
    useState(false);

  const handleUpdateQuantity = async (
    itemId: string,
    quantity: number,
  ) => {
    try {
      setUpdatingItemId(itemId);

      const updatedCart =
        await updateCartItem(itemId, {
          quantity,
        });

      setCart(updatedCart);
    } catch (error) {
      console.error(
        "Failed to update cart item:",
        error,
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (
    itemId: string,
  ) => {
    try {
      setUpdatingItemId(itemId);

      const updatedCart =
        await removeCartItem(itemId);

      setCart(updatedCart);
    } catch (error) {
      console.error(
        "Failed to remove cart item:",
        error,
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setClearing(true);

      const updatedCart =
        await clearCart();

      setCart(updatedCart);
    } catch (error) {
      console.error(
        "Failed to clear cart:",
        error,
      );
    } finally {
      setClearing(false);
    }
  };

  if (cart.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-lg font-semibold">
            Cart Items ({cart.itemCount})
          </h2>

          <button
            type="button"
            onClick={handleClearCart}
            disabled={clearing}
            className="text-sm text-gray-500 hover:text-black disabled:opacity-40"
          >
            {clearing
              ? "Clearing..."
              : "Clear cart"}
          </button>
        </div>

        <div>
          {cart.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              updating={
                updatingItemId === item.id
              }
              onUpdateQuantity={
                handleUpdateQuantity
              }
              onRemove={handleRemove}
            />
          ))}
        </div>
      </section>

      <CartSummary
        subtotal={cart.subtotal}
      />
    </div>
  );
}