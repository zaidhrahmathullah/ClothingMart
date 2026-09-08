import { apiFetch } from "@/lib/api";
import type { Cart } from "@/types/cart";

export type AddCartItemData = {
  variantId: string;
  quantity: number;
};

export type UpdateCartItemData = {
  quantity: number;
};

export async function getCart() {
  return apiFetch<Cart>("/cart");
}

export async function addCartItem(
  data: AddCartItemData,
) {
  return apiFetch<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCartItem(
  itemId: string,
  data: UpdateCartItemData,
) {
  return apiFetch<Cart>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function removeCartItem(
  itemId: string,
) {
  return apiFetch<Cart>(
    `/cart/items/${itemId}`,
    {
      method: "DELETE",
    },
  );
}

export async function clearCart() {
  return apiFetch<Cart>("/cart", {
    method: "DELETE",
  });
}