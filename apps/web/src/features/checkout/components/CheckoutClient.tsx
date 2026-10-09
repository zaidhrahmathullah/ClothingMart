"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import InlineAlert from "@/components/feedback/InlineAlert";

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

  function handlePaymentSuccess(
    orderId: string,
  ) {
    router.push(
      `/orders/${orderId}/success`,
    );
    router.refresh();
  }

  function handlePaymentError(
    message: string,
  ) {
    setError(message);
  }

  const [cart] =
    useState(initialCart);

  const [
    addresses,
    setAddresses,
  ] = useState(initialAddresses);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState(
    initialAddresses.find(
      (address) => address.isDefault,
    )?.id ??
      initialAddresses[0]?.id ??
      "",
  );

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(
    initialAddresses.length === 0,
  );

  const [error, setError] =
    useState<string | null>(null);

  function handleAddressCreated(
    address: Address,
  ) {
    setAddresses((current) => [
      address,
      ...current,
    ]);

    setError(null);

    setSelectedAddressId(address.id);

    setShowAddressForm(false);
  }

  async function handleCreateClothingMartOrder() {
    if (!selectedAddressId) {
      throw new Error(
        "Please select a shipping address.",
      );
    }

    setError(null);

    const order = await createOrder(
      selectedAddressId,
    );

    return order.id;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start xl:gap-8">
      <div className="min-w-0 space-y-5">
        {error && (
          <InlineAlert
            tone="error"
            title="Checkout could not continue"
          >
            {error}
          </InlineAlert>
        )}

        <section className="overflow-hidden rounded border border-neutral-200 bg-white">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Step 01
              </p>

              <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
                Delivery Address
              </h2>

              <p className="mt-1 text-[12px] leading-5 text-neutral-500">
                Choose where you would like
                this order to be delivered.
              </p>
            </div>

            {addresses.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setShowAddressForm(
                    (current) => !current,
                  )
                }
                className="shrink-0 rounded px-3 py-2 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                {showAddressForm
                  ? "Cancel"
                  : "Add New"}
              </button>
            )}
          </div>

          <div className="p-5 sm:p-6">
            {addresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map(
                  (address) => {
                    const selected =
                      selectedAddressId ===
                      address.id;

                    return (
                      <button
                        key={address.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddressId(
                            address.id,
                          );
                          setError(null);
                        }}
                        className={`w-full rounded border p-4 text-left transition-colors ${
                          selected
                            ? "border-neutral-950 bg-neutral-50"
                            : "border-neutral-200 bg-white hover:border-neutral-400"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-neutral-950"
                                : "border-neutral-300"
                            }`}
                          >
                            {selected && (
                              <span className="h-2 w-2 rounded-full bg-neutral-950" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[13px] font-semibold text-neutral-950">
                                {
                                  address.fullName
                                }
                              </p>

                              <span className="rounded bg-neutral-100 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-neutral-600">
                                {address.label}
                              </span>

                              {address.isDefault && (
                                <span className="rounded bg-neutral-950 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-white">
                                  Default
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-[11px] text-neutral-500">
                              {address.phone}
                            </p>

                            <div className="mt-2 text-[11px] leading-5 text-neutral-500">
                              <p>
                                {
                                  address.addressLine1
                                }
                                {address.addressLine2 &&
                                  `, ${address.addressLine2}`}
                              </p>

                              <p>
                                {address.city},{" "}
                                {
                                  address.district
                                }
                              </p>

                              <p>
                                {
                                  address.postalCode
                                }
                                ,{" "}
                                {
                                  address.country
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}

            {showAddressForm && (
              <div
                className={
                  addresses.length > 0
                    ? "mt-5 border-t border-neutral-200 pt-5"
                    : ""
                }
              >
                <div className="rounded border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    New Address
                  </p>

                  <h3 className="mt-1 text-[13px] font-semibold text-neutral-950">
                    Add Shipping Address
                  </h3>

                  <div className="mt-4">
                    <AddressForm
                      onCreated={
                        handleAddressCreated
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <CheckoutSummary
        cart={cart}
        disabled={!selectedAddressId}
        onCreateClothingMartOrder={
          handleCreateClothingMartOrder
        }
        onPaymentSuccess={
          handlePaymentSuccess
        }
        onPaymentError={
          handlePaymentError
        }
      />
    </div>
  );
}