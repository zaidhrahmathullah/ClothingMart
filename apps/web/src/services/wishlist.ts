import { apiFetch } from "@/lib/api";

export async function addToWishlist(
  productId: string,
) {
  return apiFetch(
    `/wishlist/${productId}`,
    {
      method: "POST",
    },
  );
}

export async function removeFromWishlist(
  productId: string,
) {
  return apiFetch(
    `/wishlist/${productId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getWishlist() {
  return apiFetch("/wishlist");
}