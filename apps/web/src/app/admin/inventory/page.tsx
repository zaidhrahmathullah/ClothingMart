"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminInventoryList } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminPage,
  AdminState,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminInventoryPage() {
  const [data, setData] = useState<AdminInventoryList | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  function load() {
    adminApi
      .inventory({ search, limit: 100 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load inventory",
        ),
      );
  }
  useEffect(() => {
    load();
  }, []);
  async function save(id: string, value: string) {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    setSaving(id);
    try {
      await adminApi.updateInventory(id, quantity);
      load();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to update inventory",
      );
    } finally {
      setSaving("");
    }
  }
  return (
    <AdminPage
      title="Inventory"
      description="Keep stock quantities accurate across every variant."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
        className="mb-4 flex max-w-xl gap-2"
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product or SKU"
          className={inputClass}
        />
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {error && <AdminState error>{error}</AdminState>}
      {!data && !error ? (
        <AdminState>Loading inventory...</AdminState>
      ) : data && data.inventory.length === 0 ? (
        <AdminState>No inventory rows found.</AdminState>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-175 text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Options</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.inventory.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-semibold">
                      {row.variant.product.name}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {row.variant.sku}
                    </td>
                    <td className="px-4 py-3">
                      {row.variant.size} / {row.variant.color}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        aria-label={`Quantity for ${row.variant.sku}`}
                        defaultValue={row.quantity}
                        type="number"
                        min="0"
                        className={`${inputClass} max-w-28`}
                        onBlur={(event) =>
                          save(row.variant.id, event.target.value)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {saving === row.variant.id && (
                        <span className="text-xs text-neutral-500">
                          Saving...
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </AdminPage>
  );
}
