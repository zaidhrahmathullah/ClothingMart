import { redirect } from "next/navigation";

import Container from "@/components/ui/Container";
import CartClient from "@/features/cart/components/CartClient";
import { serverApiFetch } from "@/lib/server-api";
import type { Cart } from "@/types/cart";

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
    <main className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white">
        <Container>
          <div className="py-9 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Shopping Bag
            </p>

            <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Your Cart
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-5 text-neutral-500">
              Review your selected pieces and
              quantities before continuing to
              checkout.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-7 sm:py-8 lg:py-10">
          <CartClient initialCart={cart} />
        </div>
      </Container>
    </main>
  );
}