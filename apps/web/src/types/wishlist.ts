import type { Product } from "./product";

export type WishlistItem = {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
};

export type Wishlist = {
  id: string;
  userId: string;
  items: WishlistItem[];
};