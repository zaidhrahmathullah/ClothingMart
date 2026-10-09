"use client";

import {
  Check,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { useState } from "react";

import {
  createAddress,
  updateAddress,
} from "@/services/address";

import type {
  Address,
  CreateAddressData,
} from "@/types/address";

type AccountAddressFormProps = {
  address?: Address | null;
  onSaved: (address: Address) => void;
  onCancel: () => void;
};

function getInitialForm(
  address?: Address | null,
): CreateAddressData {
  if (address) {
    return {
      label: address.label,
      isDefault: address.isDefault,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2:
        address.addressLine2 ?? "",
      city: address.city,
      district: address.district,
      postalCode: address.postalCode,
      country: address.country,
    };
  }

  return {
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
}

const inputClassName =
  "mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export default function AccountAddressForm({
  address,
  onSaved,
  onCancel,
}: AccountAddressFormProps) {
  const [form, setForm] =
    useState<CreateAddressData>(() =>
      getInitialForm(address),
    );

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  function updateField(
    field: keyof CreateAddressData,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const savedAddress = address
        ? await updateAddress(
            address.id,
            form,
          )
        : await createAddress(form);

      onSaved(savedAddress);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save address.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
      aria-busy={isSubmitting}
    >
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3.5 py-3 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
          <MapPin className="h-4 w-4" />
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
            {address
              ? "Address Details"
              : "Delivery Address"}
          </p>

          <h3 className="mt-0.5 text-sm font-semibold text-neutral-950">
            {address
              ? "Edit address"
              : "New address"}
          </h3>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-neutral-700">
            Address label
          </label>

          <input
            required
            maxLength={40}
            placeholder="Home, Work..."
            value={form.label}
            onChange={(event) =>
              updateField(
                "label",
                event.target.value,
              )
            }
            className={inputClassName}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-neutral-700">
            Address line 2{" "}
            <span className="font-normal text-neutral-400">
              (optional)
            </span>
          </label>

          <input
            value={form.addressLine2 ?? ""}
            onChange={(event) =>
              updateField(
                "addressLine2",
                event.target.value,
              )
            }
            className={inputClassName}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-neutral-700">
            Country
          </label>

          <input
            required
            value={form.country}
            onChange={(event) =>
              updateField(
                "country",
                event.target.value,
              )
            }
            className={inputClassName}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {!address?.isDefault && (
        <label className="flex cursor-pointer items-start gap-3 rounded border border-neutral-200 bg-neutral-50 p-4">
          <input
            type="checkbox"
            checked={form.isDefault ?? false}
            disabled={isSubmitting}
            onChange={(event) =>
              updateField(
                "isDefault",
                event.target.checked,
              )
            }
            className="mt-0.5 h-4 w-4 accent-neutral-950"
          />

          <span>
            <span className="block text-[13px] font-semibold text-neutral-950">
              Make this my default address
            </span>

            <span className="mt-1 block text-[11px] leading-5 text-neutral-500">
              We&apos;ll select it
              automatically when you check
              out.
            </span>
          </span>
        </label>
      )}

      <div className="flex flex-col-reverse gap-2 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded border border-neutral-300 px-4 py-2.5 text-xs font-semibold text-neutral-600 transition hover:border-neutral-950 hover:text-neutral-950 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}

          {isSubmitting
            ? "Saving address..."
            : address
              ? "Save changes"
              : "Save address"}
        </button>
      </div>
    </form>
  );
}