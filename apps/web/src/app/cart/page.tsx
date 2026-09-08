import { redirect } from "next/navigation";

import { serverApiFetch } from "@/lib/server-api";
import type { Cart } from "@/types/cart";

import CartClient from "@/features/cart/components/CartClient";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  let cart: Cart;

  try {
    cart =
      await serverApiFetch<Cart>("/cart");
  } catch {
    redirect("/login");
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Cart
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your items before checkout.
          </p>
        </div>

        <CartClient initialCart={cart} />
      </div>
    </main>
  );
}