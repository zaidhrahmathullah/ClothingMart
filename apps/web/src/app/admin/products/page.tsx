"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminProductList } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminLink,
  AdminPage,
  AdminState,
  formatDate,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminProductsPage() {
  const [data, setData] = useState<AdminProductList | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  function load() {
    setLoading(true);
    adminApi
      .products({ search, limit: 50 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load products",
        ),
      )
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    adminApi
      .products({ limit: 50 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load products",
        ),
      );
  }, []);
  async function toggle(product: AdminProductList["products"][number]) {
    if (
      !window.confirm(
        `${product.isActive ? "Deactivate" : "Activate"} this product?`,
      )
    )
      return;
    try {
      await (product.isActive
        ? adminApi.deactivateProduct(product.id)
        : adminApi.activateProduct(product.id));
      load();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to update product",
      );
    }
  }
  return (
    <AdminPage
      title="Products"
      description="Create and maintain your product catalogue."
      action={<AdminLink href="/admin/products/new">New product</AdminLink>}
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
          placeholder="Search products"
          className={inputClass}
        />
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {error && <AdminState error>{error}</AdminState>}
      {!data && !error ? (
        <AdminState>Loading products...</AdminState>
      ) : data && data.products.length === 0 ? (
        <AdminState>No products found.</AdminState>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Variants</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-semibold text-neutral-950 hover:underline"
                        href={`/admin/products/${product.id}`}
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-neutral-500">{product.slug}</p>
                    </td>
                    <td className="px-4 py-3">{product.category.name}</td>
                    <td className="px-4 py-3">{product.variants.length}</td>
                    <td className="px-4 py-3">
                      {product.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton
                        variant="secondary"
                        disabled={loading}
                        onClick={() => toggle(product)}
                      >
                        {product.isActive ? "Deactivate" : "Activate"}
                      </AdminButton>
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
