"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import {
  getCart,
} from "@/services/cart";

import type { Cart } from "@/types/cart";

type CartContextValue = {
  cart: Cart | null;
  itemCount: number;
  setCart: (cart: Cart | null) => void;
  refreshCart: () => Promise<Cart | null>;
};

const CartContext =
  createContext<CartContextValue | null>(null);

type CartProviderProps = {
  initialCart: Cart | null;
  children: React.ReactNode;
};

export function CartProvider({
  initialCart,
  children,
}: CartProviderProps) {
  const [cart, setCart] =
    useState<Cart | null>(initialCart);

  const refreshCart =
    useCallback(async () => {
      try {
        const refreshedCart =
          await getCart();

        setCart(refreshedCart);

        return refreshedCart;
      } catch (error) {
        console.error(
          "Failed to refresh cart:",
          error,
        );

        return null;
      }
    }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount: cart?.itemCount ?? 0,
        setCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used within CartProvider.",
    );
  }

  return context;
}