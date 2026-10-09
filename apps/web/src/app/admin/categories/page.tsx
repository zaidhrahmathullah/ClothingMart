"use client";

import {
  FolderTree,
  Layers3,
  Plus,
  Search,
  Tags,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminCategory,
  AdminCategoryList,
} from "@/features/admin/admin-types";

import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLink,
  AdminPage,
  AdminState,
  inputClass,
} from "@/features/admin/components/AdminPrimitives";

export default function AdminCategoriesPage() {
  const [data, setData] =
    useState<AdminCategoryList | null>(null);

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
        await adminApi.categories({
          search: searchValue,
          limit: 100,
        });

      setData(response);
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to load categories",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    adminApi
      .categories({
        search: "",
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
              : "Unable to load categories",
          );

          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(
    category: AdminCategory,
  ) {
    setUpdatingId(category.id);
    setError("");

    try {
      await adminApi.updateCategory(
        category.id,
        {
          isActive:
            !category.isActive,
        },
      );

      await load();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to update category",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const categories =
    data?.categories ?? [];

  const parentCount =
    categories.filter(
      (category) =>
        category.parentId === null,
    ).length;

  const childCount =
    categories.length - parentCount;

  return (
    <AdminPage
      eyebrow="Catalogue"
      title="Categories"
      description="Organize main categories and subcategories that shape customer catalogue discovery."
      action={
        <AdminLink href="/admin/categories/new">
          <Plus className="h-3.5 w-3.5" />
          New category
        </AdminLink>
      }
    >
      <div className="space-y-5">
        {data && (
          <div className="grid gap-3 sm:grid-cols-3">
            <CategorySummary
              icon={Tags}
              label="Loaded categories"
              value={categories.length}
            />

            <CategorySummary
              icon={Layers3}
              label="Main categories"
              value={parentCount}
            />

            <CategorySummary
              icon={FolderTree}
              label="Subcategories"
              value={childCount}
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
                placeholder="Search category name or slug..."
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
            Loading categories...
          </AdminState>
        ) : categories.length === 0 ? (
          <AdminState>
            {search.trim()
              ? "No categories match your search."
              : "No categories have been added yet."}
          </AdminState>
        ) : (
          <AdminCard className="overflow-hidden p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left">
                <thead className="border-b border-neutral-200 bg-neutral-50">
                  <tr className="text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                    <th className="px-5 py-3.5">
                      Category
                    </th>

                    <th className="px-4 py-3.5">
                      Structure
                    </th>

                    <th className="px-4 py-3.5">
                      Products
                    </th>

                    <th className="px-4 py-3.5">
                      Children
                    </th>

                    <th className="px-4 py-3.5">
                      Status
                    </th>

                    <th className="px-5 py-3.5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {categories.map(
                    (category) => {
                      const child =
                        category.parentId !==
                        null;

                      return (
                        <tr
                          key={category.id}
                          className="transition-colors hover:bg-neutral-50/70"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded ${
                                  child
                                    ? "bg-neutral-100 text-neutral-500"
                                    : "bg-neutral-950 text-white"
                                }`}
                              >
                                {child ? (
                                  <FolderTree className="h-3.5 w-3.5" />
                                ) : (
                                  <Layers3 className="h-3.5 w-3.5" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <Link
                                  href={`/admin/categories/${category.id}`}
                                  className="text-[12px] font-semibold text-neutral-950 transition-colors hover:text-neutral-600"
                                >
                                  {category.name}
                                </Link>

                                <p className="mt-0.5 max-w-[260px] truncate text-[10px] text-neutral-400">
                                  /category/
                                  {category.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <AdminBadge
                              tone={
                                child
                                  ? "neutral"
                                  : "info"
                              }
                            >
                              {child
                                ? "Subcategory"
                                : "Main category"}
                            </AdminBadge>

                            {child &&
                              category.parent && (
                                <p className="mt-1.5 text-[10px] text-neutral-500">
                                  Parent:{" "}
                                  <span className="font-medium text-neutral-800">
                                    {
                                      category
                                        .parent
                                        .name
                                    }
                                  </span>
                                </p>
                              )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-semibold tabular-nums text-neutral-900">
                              {category._count
                                ?.products ??
                                0}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="text-[11px] font-semibold tabular-nums text-neutral-900">
                              {category._count
                                ?.children ??
                                category.children
                                  ?.length ??
                                0}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <AdminBadge
                              tone={
                                category.isActive
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {category.isActive
                                ? "Active"
                                : "Inactive"}
                            </AdminBadge>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <AdminButton
                              variant="secondary"
                              disabled={
                                updatingId ===
                                category.id
                              }
                              onClick={() =>
                                void toggle(
                                  category,
                                )
                              }
                            >
                              {updatingId ===
                              category.id
                                ? "Updating..."
                                : category.isActive
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
      </div>
    </AdminPage>
  );
}

function CategorySummary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tags;
  label: string;
  value: number;
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