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
  label: "Home",
  isDefault: false,
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  postalCode: "",
  country: "Sri Lanka",
};

const inputClassName =
  "mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950";

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
      className="space-y-4"
    >
      {error && (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-700">
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
            className={inputClassName}
            placeholder="Full name"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700">
            Phone
          </label>

          <input
            required
            type="tel"
            value={form.phone}
            onChange={(event) =>
              updateField(
                "phone",
                event.target.value,
              )
            }
            className={inputClassName}
            placeholder="Phone number"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700">
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
            className={inputClassName}
            placeholder="Postal code"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-700">
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
            className={inputClassName}
            placeholder="Street address"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-700">
            Address line 2

            <span className="ml-1 font-normal text-neutral-400">
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
            className={inputClassName}
            placeholder="Apartment, suite, unit, etc."
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700">
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
            className={inputClassName}
            placeholder="City"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700">
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
            className={inputClassName}
            placeholder="District"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "Saving..."
          : "Save Address"}
      </button>
    </form>
  );
}