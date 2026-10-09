import { redirect } from "next/navigation";

import Container from "@/components/ui/Container";
import CheckoutClient from "@/features/checkout/components/CheckoutClient";
import { serverApiFetch } from "@/lib/server-api";

import type { Address } from "@/types/address";
import type { Cart } from "@/types/cart";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  let cart: Cart;
  let addresses: Address[];

  try {
    cart =
      await serverApiFetch<Cart>(
        "/cart",
      );

    addresses =
      await serverApiFetch<Address[]>(
        "/addresses",
      );
  } catch {
    redirect("/login?next=%2Fcheckout");
  }

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white">
        <Container>
          <div className="py-9 sm:py-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Secure Checkout
            </p>

            <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Checkout
            </h1>

            <p className="mt-2 max-w-xl text-[13px] leading-5 text-neutral-500">
              Confirm your delivery details and
              complete your payment securely.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <div className="py-7 sm:py-8 lg:py-10">
          <CheckoutClient
            initialCart={cart}
            initialAddresses={addresses}
          />
        </div>
      </Container>
    </main>
  );
}