"use client";

import {
  useEffect,
  useState,
} from "react";

import type { Cart } from "@/types/cart";

import {
  clearCart,
  removeCartItem,
  updateCartItem,
} from "@/services/cart";

import {
  useCart,
} from "@/features/cart/context/CartContext";

import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import EmptyCart from "./EmptyCart";

import {
  useNotification,
} from "@/components/feedback/NotificationProvider";


type CartClientProps = {
  initialCart: Cart;
};

export default function CartClient({
  initialCart,
}: CartClientProps) {
  const {
    cart,
    setCart,
  } = useCart();

  const [updatingItemId, setUpdatingItemId] =
    useState<string | null>(null);

  const [clearing, setClearing] =
    useState(false);

  const [cartError, setCartError] =
    useState<string | null>(null);

  const [cartMessage, setCartMessage] =
    useState<string | null>(null);

  const isMutating =
    updatingItemId !== null || clearing;

  const notification =
    useNotification();

  /*
   * The cart page is server-rendered with a fresh Cart.
   *
   * Synchronize that authoritative server snapshot with
   * the shared client-side CartProvider when this page
   * mounts or receives a new server snapshot.
   */
  useEffect(() => {
    setCart(initialCart);
  }, [
    initialCart,
    setCart,
  ]);

  const currentCart =
    cart ?? initialCart;

  const hasInvalidStock =
    currentCart.items.some(
      (item) =>
        !item.variant.inStock ||
        item.variant.stockQuantity <= 0 ||
        item.quantity >
          item.variant.stockQuantity,
    );
  
  const checkoutDisabledReason =
    isMutating
      ? "Your cart is updating. You can continue once the change is complete."
      : hasInvalidStock
        ? "Resolve the stock issue in your cart before continuing to checkout."
        : undefined;

  const handleUpdateQuantity = async (
    itemId: string,
    quantity: number,
  ) => {
    if (isMutating) return;

    try {
      setUpdatingItemId(itemId);
      setCartError(null);
      setCartMessage(null);

      const updatedCart =
        await updateCartItem(itemId, {
          quantity,
        });

      setCart(updatedCart);
      setCartMessage(
        "Cart quantity updated.",
      );
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to update the item quantity.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemove = async (
    itemId: string,
  ) => {
    if (isMutating) return;

    try {
      setUpdatingItemId(itemId);
      setCartError(null);
      setCartMessage(null);

      const updatedCart =
        await removeCartItem(itemId);

      setCart(updatedCart);
      setCartMessage(
        "Item removed from your cart.",
      );
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to remove this item.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    if (isMutating) return;

    const confirmed =
      await notification.confirm({
        title: "Clear your cart?",
        message:
          "This will remove every item currently in your cart.",
        confirmLabel: "Clear cart",
        cancelLabel: "Keep items",
        tone: "danger",
      });

    if (!confirmed) return;

    try {
      setClearing(true);
      setCartError(null);
      setCartMessage(null);

      const updatedCart =
        await clearCart();

      setCart(updatedCart);
    } catch (error) {
      setCartError(
        error instanceof Error
          ? error.message
          : "Unable to clear your cart.",
      );
    } finally {
      setClearing(false);
    }
  };

  if (currentCart.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:gap-8">
      <section className="min-w-0 overflow-hidden rounded border border-neutral-200 bg-white">
        <div
          aria-live="polite"
          aria-atomic="true"
        >
          {cartError && (
            <div
              role="alert"
              className="m-5 mb-0 rounded border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700 sm:mx-6"
            >
              {cartError}
            </div>
          )}

          {cartMessage && (
            <div className="m-5 mb-0 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] font-medium text-emerald-700 sm:mx-6">
              {cartMessage}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Selected Pieces
            </p>

            <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
              Cart Items
            </h2>

            <p className="mt-0.5 text-[11px] text-neutral-500">
              {currentCart.itemCount}{" "}
              {currentCart.itemCount === 1
                ? "item"
                : "items"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            disabled={isMutating}
            className="rounded px-3 py-2 text-xs font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {clearing
              ? "Clearing..."
              : "Clear cart"}
          </button>
        </div>

        <div className="divide-y divide-neutral-200">
          {currentCart.items.map(
            (item) => (
              <CartItem
                key={item.id}
                item={item}
                updating={isMutating}
                isUpdatingThisItem={
                  updatingItemId === item.id
                }
                onUpdateQuantity={
                  handleUpdateQuantity
                }
                onRemove={handleRemove}
              />
            ),
          )}
        </div>
      </section>

      <CartSummary
        subtotal={currentCart.subtotal}
        checkoutDisabled={
          hasInvalidStock ||
          isMutating
        }
        checkoutDisabledReason={
          checkoutDisabledReason
        }
      />
    </div>
  );
}