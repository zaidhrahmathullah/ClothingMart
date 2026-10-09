"use client";

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Search,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminInventoryList,
} from "@/features/admin/admin-types";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminPage,
  AdminState,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminInventoryPage() {
  const [data, setData] =
    useState<AdminInventoryList | null>(
      null,
    );

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState("");

  async function load(
    searchValue = search,
  ) {
    setLoading(true);
    setError("");

    try {
      const response =
        await adminApi.inventory({
          search: searchValue,
          limit: 100,
        });

      setData(response);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load inventory",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    adminApi
      .inventory({
        limit: 100,
      })
      .then((response) => {
        if (!cancelled) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((value: unknown) => {
        if (!cancelled) {
          setError(
            value instanceof Error
              ? value.message
              : "Unable to load inventory",
          );

          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function save(
    id: string,
    value: string,
  ) {
    const quantity =
      Number(value);

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 0
    ) {
      setError(
        "Stock quantity must be a non-negative whole number.",
      );
      return;
    }

    setSaving(id);
    setError("");

    try {
      await adminApi.updateInventory(
        id,
        quantity,
      );

      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to update inventory",
      );
    } finally {
      setSaving("");
    }
  }

  const inventory =
    data?.inventory ?? [];

  const outOfStock =
    inventory.filter(
      (row) =>
        row.quantity === 0,
    ).length;

  const lowStock =
    inventory.filter(
      (row) =>
        row.quantity > 0 &&
        row.quantity <= 5,
    ).length;

  const healthy =
    inventory.filter(
      (row) =>
        row.quantity > 5,
    ).length;

  return (
    <AdminPage
      eyebrow="Stock control"
      title="Inventory"
      description="Monitor and maintain stock quantities for every product variant."
    >
      <div className="space-y-5">
        {/* Summary */}
        {data && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InventorySummary
              icon={Boxes}
              label="Loaded variants"
              value={
                inventory.length
              }
            />

            <InventorySummary
              icon={CheckCircle2}
              label="Healthy stock"
              value={healthy}
            />

            <InventorySummary
              icon={AlertTriangle}
              label="Low stock"
              value={lowStock}
              warning
            />

            <InventorySummary
              icon={XCircle}
              label="Out of stock"
              value={outOfStock}
              danger
            />
          </div>
        )}

        {/* Controls */}
        <AdminCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Find inventory
              </p>

              <p className="mt-1 text-[12px] font-medium text-neutral-900">
                Search product or
                variant SKU
              </p>

              <form
                onSubmit={(
                  event,
                ) => {
                  event.preventDefault();
                  void load();
                }}
                className="mt-3 flex flex-col gap-2 sm:max-w-xl sm:flex-row"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

                  <input
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search product or SKU..."
                    className={`${inputClass} pl-9`}
                  />
                </div>

                <AdminButton
                  type="submit"
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Searching..."
                    : "Search"}
                </AdminButton>
              </form>
            </div>

            <div>
              <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Stock thresholds
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-neutral-500">
                <StockLegend
                  className="bg-emerald-500"
                  label="Healthy"
                  value="> 5"
                />

                <StockLegend
                  className="bg-amber-500"
                  label="Low"
                  value="1–5"
                />

                <StockLegend
                  className="bg-red-500"
                  label="Out"
                  value="0"
                />
              </div>
            </div>
          </div>
        </AdminCard>

        {error && (
          <AdminState error>
            {error}
          </AdminState>
        )}

        {loading && !data ? (
          <AdminState>
            Loading inventory...
          </AdminState>
        ) : inventory.length ===
          0 ? (
          <AdminState>
            {search.trim()
              ? "No inventory items match your search."
              : "No inventory items are available yet."}
          </AdminState>
        ) : (
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[12px] font-semibold text-neutral-950">
                    Variant stock
                  </p>

                  <p className="mt-0.5 text-[10px] text-neutral-500">
                    Change a quantity
                    and leave the field
                    to save it
                    automatically.
                  </p>
                </div>

                <p className="text-[10px] text-neutral-400">
                  {inventory.length}{" "}
                  {inventory.length ===
                  1
                    ? "variant"
                    : "variants"}{" "}
                  loaded
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50/80">
                  <tr className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    <th className="px-5 py-3">
                      Product
                    </th>

                    <th className="px-3 py-3">
                      SKU
                    </th>

                    <th className="px-3 py-3">
                      Variant
                    </th>

                    <th className="px-3 py-3">
                      Stock state
                    </th>

                    <th className="px-3 py-3">
                      Quantity
                    </th>

                    <th className="px-5 py-3 text-right">
                      Save state
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {inventory.map(
                    (row) => {
                      const tone =
                        getStockTone(
                          row.quantity,
                        );

                      const isSaving =
                        saving ===
                        row.variant
                          .id;

                      return (
                        <tr
                          key={
                            row.id
                          }
                          className="transition-colors hover:bg-neutral-50/70"
                        >
                          <td className="px-5 py-3">
                            <div className="max-w-[240px]">
                              <p className="truncate text-[11px] font-semibold text-neutral-950">
                                {
                                  row
                                    .variant
                                    .product
                                    .name
                                }
                              </p>

                              <p className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-neutral-400">
                                Product
                                variant
                              </p>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <code className="rounded bg-neutral-100 px-1.5 py-1 text-[10px] text-neutral-600">
                              {
                                row
                                  .variant
                                  .sku
                              }
                            </code>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-medium text-neutral-900">
                                {
                                  row
                                    .variant
                                    .size
                                }
                              </span>

                              <span className="text-neutral-300">
                                /
                              </span>

                              <span className="text-neutral-500">
                                {
                                  row
                                    .variant
                                    .color
                                }
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <AdminBadge
                              tone={
                                tone.tone
                              }
                            >
                              {
                                tone.label
                              }
                            </AdminBadge>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 shrink-0 rounded-full ${
                                  tone.dotClassName
                                }`}
                              />

                              <input
                                aria-label={`Quantity for ${row.variant.sku}`}
                                defaultValue={
                                  row.quantity
                                }
                                key={`${row.id}-${row.quantity}`}
                                type="number"
                                min="0"
                                className={`${inputClass} h-8 max-w-24 px-2.5 py-1 text-[11px] font-semibold tabular-nums`}
                                disabled={
                                  isSaving
                                }
                                onBlur={(
                                  event,
                                ) => {
                                  if (
                                    Number(
                                      event
                                        .target
                                        .value,
                                    ) !==
                                    row.quantity
                                  ) {
                                    void save(
                                      row
                                        .variant
                                        .id,
                                      event
                                        .target
                                        .value,
                                    );
                                  }
                                }}
                              />
                            </div>
                          </td>

                          <td className="px-5 py-3 text-right">
                            {isSaving ? (
                              <span className="text-[10px] font-medium text-neutral-600">
                                Saving...
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400">
                                Auto-save
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </AdminCard>
        )}

        {data &&
          data.pagination.total >
            inventory.length && (
            <p className="text-center text-[10px] text-neutral-500">
              Showing{" "}
              {inventory.length} of{" "}
              {
                data.pagination
                  .total
              }{" "}
              inventory entries.
            </p>
          )}
      </div>
    </AdminPage>
  );
}

function getStockTone(
  quantity: number,
): {
  label: string;
  tone:
    | "success"
    | "warning"
    | "danger";
  dotClassName: string;
} {
  if (quantity === 0) {
    return {
      label: "Out of stock",
      tone: "danger",
      dotClassName:
        "bg-red-500",
    };
  }

  if (quantity <= 5) {
    return {
      label: "Low stock",
      tone: "warning",
      dotClassName:
        "bg-amber-500",
    };
  }

  return {
    label: "Healthy",
    tone: "success",
    dotClassName:
      "bg-emerald-500",
  };
}

function StockLegend({
  className,
  label,
  value,
}: {
  className: string;
  label: string;
  value: string;
}) {
  return (
    <span className="inline-flex items-center">
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${className}`}
      />

      <span>
        {label}{" "}
        <span className="text-neutral-400">
          {value}
        </span>
      </span>
    </span>
  );
}

function InventorySummary({
  icon: Icon,
  label,
  value,
  warning = false,
  danger = false,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
          danger
            ? "bg-red-50 text-red-700"
            : warning
              ? "bg-amber-50 text-amber-700"
              : "bg-neutral-100 text-neutral-600"
        }`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0">
        <p className="text-[17px] font-semibold leading-none tracking-[-0.02em] text-neutral-950 tabular-nums">
          {value}
        </p>

        <p className="mt-1 text-[10px] text-neutral-500">
          {label}
        </p>
      </div>
    </div>
  );
}