"use client";

import {
  Check,
  Edit3,
  Home,
  LoaderCircle,
  MapPin,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import {
  deleteAddress,
  setDefaultAddress,
} from "@/services/address";

import type { Address } from "@/types/address";

import AccountAddressForm from "./AccountAddressForm";

import {
  useNotification,
} from "@/components/feedback/NotificationProvider";

type AddressManagerProps = {
  initialAddresses: Address[];
};

export default function AddressManager({
  initialAddresses,
}: AddressManagerProps) {
  const notification =
    useNotification();

  const [addresses, setAddresses] =
    useState(initialAddresses);

  const [editingAddress, setEditingAddress] =
    useState<Address | null>(null);

  const [showForm, setShowForm] =
    useState(false);

  const [busyAddressId, setBusyAddressId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  function handleSaved(address: Address) {
    setAddresses((current) => {
      const exists = current.some(
        (item) => item.id === address.id,
      );

      const next = exists
        ? current.map((item) =>
            item.id === address.id
              ? address
              : item,
          )
        : [address, ...current];

      if (!address.isDefault) {
        return next;
      }

      return next.map((item) => ({
        ...item,
        isDefault:
          item.id === address.id,
      }));
    });

    setEditingAddress(null);
    setShowForm(false);
    setError(null);
  }

  async function handleSetDefault(
    addressId: string,
  ) {
    if (busyAddressId) return;

    try {
      setBusyAddressId(addressId);
      setError(null);

      const updated =
        await setDefaultAddress(
          addressId,
        );

      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault:
            address.id === updated.id,
        })),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update the default address.",
      );
    } finally {
      setBusyAddressId(null);
    }
  }

  async function handleDelete(
    address: Address,
  ) {
    if (busyAddressId) return;

    const confirmed =
      await notification.confirm({
        title: "Delete this address?",
        message: `“${address.label}” will be permanently removed from your saved addresses.`,
        confirmLabel: "Delete address",
        cancelLabel: "Keep address",
        tone: "danger",
      });

    if (!confirmed) return;

    try {
      setBusyAddressId(address.id);
      setError(null);

      await deleteAddress(address.id);

      /*
       * Reload after deletion because the
       * backend may automatically promote
       * another address to default.
       */
      window.location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to delete address.",
      );

      setBusyAddressId(null);
    }
  }

  function openNewAddress() {
    setEditingAddress(null);
    setShowForm(true);
    setError(null);
  }

  function openEditAddress(
    address: Address,
  ) {
    setEditingAddress(address);
    setShowForm(true);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded border border-neutral-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-neutral-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Shipping
            </p>

            <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
              Saved Addresses
            </h2>

            <p className="mt-1.5 text-[13px] leading-5 text-neutral-500">
              Manage where your ClothingMart
              orders should be delivered.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={openNewAddress}
              className="inline-flex w-fit items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add Address
            </button>
          )}
        </div>

        {error && (
          <div className="mx-5 mt-5 rounded border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700 sm:mx-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="border-b border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <div className="rounded border border-neutral-200 bg-white p-5">
              <AccountAddressForm
                key={
                  editingAddress?.id ??
                  "new-address"
                }
                address={editingAddress}
                onSaved={handleSaved}
                onCancel={() => {
                  setEditingAddress(null);
                  setShowForm(false);
                }}
              />
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded bg-neutral-100 text-neutral-500">
              <MapPin className="h-[17px] w-[17px]" />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-neutral-950">
              No saved addresses
            </h3>

            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-5 text-neutral-500">
              Save an address now to make
              future checkouts quicker.
            </p>

            {!showForm && (
              <button
                type="button"
                onClick={openNewAddress}
                className="mt-5 inline-flex items-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4" />
                Add Your First Address
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:p-6 xl:grid-cols-2">
            {addresses.map((address) => {
              const busy =
                busyAddressId ===
                address.id;

              const settingDefault =
                busy &&
                !address.isDefault;

              return (
                <article
                  key={address.id}
                  className={`relative flex flex-col rounded border p-5 transition ${
                    address.isDefault
                      ? "border-neutral-950 bg-neutral-50"
                      : "border-neutral-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded ${
                          address.isDefault
                            ? "bg-neutral-950 text-white"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        <Home className="h-4 w-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[13px] font-semibold text-neutral-950">
                            {address.label}
                          </h3>

                          {address.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded bg-neutral-950 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.06em] text-white">
                              <Check className="h-3 w-3" />
                              Default
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          Shipping address
                        </p>
                      </div>
                    </div>

                    {busy && (
                      <LoaderCircle className="h-4 w-4 animate-spin text-neutral-400" />
                    )}
                  </div>

                  <div className="mt-5 text-[13px] leading-5 text-neutral-500">
                    <p className="font-semibold text-neutral-950">
                      {address.fullName}
                    </p>

                    <p className="mt-2">
                      {address.addressLine1}
                    </p>

                    {address.addressLine2 && (
                      <p>
                        {address.addressLine2}
                      </p>
                    )}

                    <p>
                      {address.city},{" "}
                      {address.district}
                    </p>

                    <p>
                      {address.postalCode},{" "}
                      {address.country}
                    </p>

                    <p className="mt-3">
                      {address.phone}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-neutral-200 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        openEditAddress(
                          address,
                        )
                      }
                      disabled={Boolean(
                        busyAddressId,
                      )}
                      className="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-3 py-2 text-[11px] font-semibold text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-40"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    {!address.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSetDefault(
                            address.id,
                          )
                        }
                        disabled={Boolean(
                          busyAddressId,
                        )}
                        className="inline-flex items-center gap-1.5 rounded border border-neutral-300 px-3 py-2 text-[11px] font-semibold text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-40"
                      >
                        {settingDefault ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Star className="h-3.5 w-3.5" />
                        )}

                        {settingDefault
                          ? "Updating..."
                          : "Set default"}
                          
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(address)
                      }
                      disabled={Boolean(
                        busyAddressId,
                      )}
                      className="inline-flex items-center gap-1.5 rounded px-3 py-2 text-[11px] font-semibold text-neutral-500 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded border border-neutral-200 bg-neutral-100 p-4 sm:p-5">
        <div className="flex gap-3">
          <Star className="mt-0.5 h-[18px] w-[18px] shrink-0 text-neutral-500" />

          <div>
            <p className="text-[13px] font-semibold text-neutral-950">
              About your default address
            </p>

            <p className="mt-1 text-[11px] leading-5 text-neutral-500">
              Your default address is selected
              automatically during checkout.
              You can still choose another saved
              address before placing an order.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}