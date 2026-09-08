"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createOrder } from "@/services/order";

import type { Address } from "@/types/address";
import type { Cart } from "@/types/cart";

import AddressForm from "./AddressForm";
import CheckoutSummary from "./CheckoutSummary";

type CheckoutClientProps = {
  initialCart: Cart;
  initialAddresses: Address[];
};

export default function CheckoutClient({
  initialCart,
  initialAddresses,
}: CheckoutClientProps) {
  const router = useRouter();

  const [cart] = useState(initialCart);

  const [addresses, setAddresses] = useState(initialAddresses);

  const [selectedAddressId, setSelectedAddressId] = useState(
    initialAddresses[0]?.id ?? "",
  );

  const [showAddressForm, setShowAddressForm] = useState(
    initialAddresses.length === 0,
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  function handleAddressCreated(address: Address) {
    setAddresses((current) => [address, ...current]);

    setSelectedAddressId(address.id);

    setShowAddressForm(false);
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      setError("Please select a shipping address.");

      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const order = await createOrder(selectedAddressId);

      router.push(`/orders/${order.id}/success`);

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to place your order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 lg:py-16">
      <div className="mb-10">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Checkout
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          Complete Your Order
        </h1>
      </div>

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <section className="space-y-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Shipping Address
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Where should we deliver your order?
                </p>
              </div>

              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setShowAddressForm((current) => !current)
                  }
                  className="text-sm font-semibold text-neutral-950 underline underline-offset-4"
                >
                  {showAddressForm ? "Cancel" : "Add New"}
                </button>
              )}
            </div>

            {addresses.length > 0 && (
              <div className="mt-6 space-y-3">
                {addresses.map((address) => {
                  const selected = selectedAddressId === address.id;

                  return (
                    <button
                      key={address.id}
                      type="button"
                      onClick={() => setSelectedAddressId(address.id)}
                      className={`w-full rounded-xl border p-5 text-left transition ${
                        selected
                          ? "border-neutral-950 ring-1 ring-neutral-950"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
                            selected
                              ? "border-neutral-950 bg-neutral-950"
                              : "border-neutral-400"
                          }`}
                        />

                        <div>
                          <p className="font-semibold">
                            {address.fullName}
                          </p>

                          <p className="mt-1 text-sm text-neutral-600">
                            {address.phone}
                          </p>

                          <p className="mt-2 text-sm leading-6 text-neutral-600">
                            {address.addressLine1}
                            {address.addressLine2 &&
                              `, ${address.addressLine2}`}
                            <br />
                            {address.city}, {address.district}
                            <br />
                            {address.postalCode}, {address.country}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {showAddressForm && (
              <div className="mt-8 border-t border-neutral-200 pt-8">
                <h3 className="mb-6 font-semibold">
                  Add Shipping Address
                </h3>

                <AddressForm onCreated={handleAddressCreated} />
              </div>
            )}
          </div>
        </section>

        <CheckoutSummary
          cart={cart}
          isSubmitting={isSubmitting}
          disabled={!selectedAddressId}
          onPlaceOrder={handlePlaceOrder}
        />
      </div>
    </main>
  );
}
