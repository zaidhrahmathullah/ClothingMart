"use client";

import { useState } from "react";

import {
  createAddress,
} from "@/services/address";

import type {
  Address,
  CreateAddressData,
} from "@/types/address";

type AddressFormProps = {
  onCreated: (
    address: Address,
  ) => void;
};

const initialForm: CreateAddressData = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "Sri Lanka",
};

export default function AddressForm({
  onCreated,
}: AddressFormProps) {
  const [form, setForm] =
    useState(initialForm);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CreateAddressData,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setError(null);

      const address =
        await createAddress(form);

      onCreated(address);

      setForm(initialForm);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create address.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">
            Full name
          </label>

          <input
            required
            value={form.fullName}
            onChange={(event) =>
              updateField(
                "fullName",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Phone
          </label>

          <input
            required
            value={form.phone}
            onChange={(event) =>
              updateField(
                "phone",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Postal code
          </label>

          <input
            required
            value={form.postalCode}
            onChange={(event) =>
              updateField(
                "postalCode",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">
            Address line 1
          </label>

          <input
            required
            value={form.addressLine1}
            onChange={(event) =>
              updateField(
                "addressLine1",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-medium">
            Address line 2
            <span className="ml-1 text-neutral-400">
              (optional)
            </span>
          </label>

          <input
            value={
              form.addressLine2 ?? ""
            }
            onChange={(event) =>
              updateField(
                "addressLine2",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            City
          </label>

          <input
            required
            value={form.city}
            onChange={(event) =>
              updateField(
                "city",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            District
          </label>

          <input
            required
            value={form.district}
            onChange={(event) =>
              updateField(
                "district",
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg border border-neutral-950 px-5 py-3 text-sm font-semibold transition hover:bg-neutral-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Saving..."
          : "Save Address"}
      </button>
    </form>
  );
}