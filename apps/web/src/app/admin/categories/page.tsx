"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminCategoryList } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminLink,
  AdminPage,
  AdminState,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminCategoriesPage() {
  const [data, setData] = useState<AdminCategoryList | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  function load() {
    adminApi
      .categories({ search, limit: 50 })
      .then(setData)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load categories",
        ),
      );
  }
  useEffect(() => {
    load();
  }, []);
  async function toggle(category: AdminCategoryList["categories"][number]) {
    try {
      await adminApi.updateCategory(category.id, {
        isActive: !category.isActive,
      });
      load();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to update category",
      );
    }
  }
  return (
    <AdminPage
      title="Categories"
      description="Organize products into manageable collections."
      action={<AdminLink href="/admin/categories/new">New category</AdminLink>}
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
          placeholder="Search categories"
          className={inputClass}
        />
        <AdminButton type="submit">Search</AdminButton>
      </form>
      {error && <AdminState error>{error}</AdminState>}
      {!data && !error ? (
        <AdminState>Loading categories...</AdminState>
      ) : data && data.categories.length === 0 ? (
        <AdminState>No categories found.</AdminState>
      ) : (
        data && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Products</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/categories/${category.id}`}
                        className="font-semibold text-neutral-950 hover:underline"
                      >
                        {category.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {category.slug}
                    </td>
                    <td className="px-4 py-3">
                      {category._count?.products ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {category.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AdminButton
                        variant="secondary"
                        onClick={() => toggle(category)}
                      >
                        {category.isActive ? "Deactivate" : "Activate"}
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
