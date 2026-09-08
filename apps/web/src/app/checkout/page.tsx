import { redirect } from "next/navigation";


import { serverApiFetch } from "@/lib/server-api";

import type { Address } from "@/types/address";
import type { Cart } from "@/types/cart";

import CheckoutClient from "@/features/checkout/components/CheckoutClient";

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
    redirect("/login");
  }

  if (cart.items.length === 0) {
    redirect("/cart");
  }

  return (
    <CheckoutClient
      initialCart={cart}
      initialAddresses={addresses}
    />
  );
}