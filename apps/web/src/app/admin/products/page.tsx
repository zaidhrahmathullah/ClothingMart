"use client";

import {
  Package,
  Plus,
  Search,
  Shapes,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminProductList,
} from "@/features/admin/admin-types";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLink,
  AdminPage,
  AdminState,
  formatDate,
  formatMoney,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

import {
  useNotification,
} from "@/components/feedback/NotificationProvider";

type Product =
  AdminProductList["products"][number];

export default function AdminProductsPage() {
  const [data, setData] =
    useState<AdminProductList | null>(null);

  const notification = useNotification();

  const [search, setSearch] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  async function load(
    searchValue = search,
  ) {
    setLoading(true);
    setError("");

    try {
      const response =
        await adminApi.products({
          search: searchValue,
          limit: 50,
        });

      setData(response);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load products",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    adminApi
      .products({ limit: 50 })
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
              : "Unable to load products",
          );

          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(
    product: Product,
  ) {
    const action = product.isActive
      ? "deactivate"
      : "activate";

    const confirmed =
      await notification.confirm({
        title: `${
          product.isActive
            ? "Deactivate"
            : "Activate"
        } product?`,
        message: `This will ${action} “${product.name}” in the catalogue.`,
        confirmLabel: product.isActive
          ? "Deactivate product"
          : "Activate product",
        cancelLabel: "Keep unchanged",
        tone: product.isActive
          ? "danger"
          : "default",
      });

    if (!confirmed) return;

    setUpdatingId(product.id);
    setError("");

    try {
      if (product.isActive) {
        await adminApi.deactivateProduct(
          product.id,
        );
      } else {
        await adminApi.activateProduct(
          product.id,
        );
      }

      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to update product",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const products =
    data?.products ?? [];

  const activeCount =
    products.filter(
      (product) => product.isActive,
    ).length;

  const variantCount =
    products.reduce(
      (total, product) =>
        total + product.variants.length,
      0,
    );

  return (
    <AdminPage
      eyebrow="Catalogue"
      title="Products"
      description="Manage product information, variants, pricing and catalogue availability."
      action={
        <AdminLink href="/admin/products/new">
          <Plus className="h-3.5 w-3.5" />
          New product
        </AdminLink>
      }
    >
      <div className="space-y-5">
        {data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Summary
              label="Loaded products"
              value={products.length}
              icon={Package}
            />

            <Summary
              label="Active"
              value={activeCount}
              icon={Shapes}
            />

            <Summary
              label="Variants"
              value={variantCount}
              icon={Package}
            />
          </div>
        )}

        <AdminCard>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void load();
            }}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search product name or catalogue..."
                className={`${inputClass} pl-9`}
              />
            </div>

            <AdminButton
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Searching..."
                : "Search"}
            </AdminButton>
          </form>
        </AdminCard>

        {error && (
          <AdminState error>
            {error}
          </AdminState>
        )}

        {loading && !data ? (
          <AdminState>
            Loading products...
          </AdminState>
        ) : products.length === 0 ? (
          <AdminState>
            {search.trim()
              ? "No products match your search."
              : "No products have been added yet."}
          </AdminState>
        ) : (
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    <th className="px-5 py-3.5">
                      Product
                    </th>

                    <th className="px-4 py-3.5">
                      Category
                    </th>

                    <th className="px-4 py-3.5">
                      Pricing
                    </th>

                    <th className="px-4 py-3.5">
                      Variants
                    </th>

                    <th className="px-4 py-3.5">
                      Status
                    </th>

                    <th className="px-4 py-3.5">
                      Created
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {products.map(
                    (product) => {
                      const prices =
                        product.variants
                          .map((variant) =>
                            Number(
                              variant.discountedPrice ??
                                variant.price,
                            ),
                          )
                          .filter(
                            Number.isFinite,
                          );

                      const minimumPrice =
                        prices.length
                          ? Math.min(
                              ...prices,
                            )
                          : null;

                      const discounted =
                        product.variants.some(
                          (variant) =>
                            variant.discountedPrice !==
                            null,
                        );

                      const image =
                        product.images
                          .slice()
                          .sort(
                            (a, b) =>
                              a.sortOrder -
                              b.sortOrder,
                          )[0];

                      return (
                        <tr
                          key={product.id}
                          className="transition-colors hover:bg-neutral-50/70"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                                {image ? (
                                  <img
                                    src={
                                      image.imageUrl
                                    }
                                    alt={
                                      image.altText ??
                                      product.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-3.5 w-3.5 text-neutral-400" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  href={`/admin/products/${product.id}`}
                                  className="text-[12px] font-semibold text-neutral-950 transition-colors hover:text-neutral-600"
                                >
                                  {
                                    product.name
                                  }
                                </Link>

                                <p className="mt-0.5 max-w-[240px] truncate text-[10px] text-neutral-400">
                                  {
                                    product.slug
                                  }
                                </p>

                                {product.isNew && (
                                  <div className="mt-1.5">
                                    <AdminBadge tone="info">
                                      New
                                    </AdminBadge>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-[11px] text-neutral-600">
                            {
                              product
                                .category
                                .name
                            }
                          </td>

                          <td className="px-4 py-3.5">
                            {minimumPrice !==
                            null ? (
                              <>
                                <p className="text-[11px] font-semibold text-neutral-950">
                                  From{" "}
                                  {formatMoney(
                                    minimumPrice,
                                  )}
                                </p>

                                {discounted && (
                                  <p className="mt-0.5 text-[10px] text-emerald-700">
                                    Discount
                                    available
                                  </p>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-neutral-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-semibold tabular-nums text-neutral-900">
                              {
                                product
                                  .variants
                                  .length
                              }
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <AdminBadge
                              tone={
                                product.isActive
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {product.isActive
                                ? "Active"
                                : "Inactive"}
                            </AdminBadge>
                          </td>

                          <td className="px-4 py-3.5 text-[11px] text-neutral-500">
                            {formatDate(
                              product.createdAt,
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <AdminButton
                              variant="secondary"
                              disabled={
                                updatingId ===
                                product.id
                              }
                              onClick={() =>
                                void toggle(
                                  product,
                                )
                              }
                            >
                              {updatingId ===
                              product.id
                                ? "Updating..."
                                : product.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </AdminButton>
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
            products.length && (
            <p className="text-center text-[11px] text-neutral-500">
              Showing{" "}
              {products.length} of{" "}
              {
                data.pagination
                  .total
              }{" "}
              products.
            </p>
          )}
      </div>
    </AdminPage>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Package;
}) {
  return (
    <div className="flex items-center gap-3 rounded border border-neutral-200 bg-white px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-600">
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div>
        <p className="text-lg font-semibold tracking-[-0.02em] tabular-nums text-neutral-950">
          {value}
        </p>

        <p className="text-[10px] text-neutral-500">
          {label}
        </p>
      </div>
    </div>
  );
}