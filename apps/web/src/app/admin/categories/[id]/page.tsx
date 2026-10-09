"use client";

import {
  useEffect,
  useState,
} from "react";
import { useParams } from "next/navigation";

import { adminApi } from "@/features/admin/admin-api";
import type { AdminCategory } from "@/features/admin/admin-types";

import CategoryForm from "@/features/admin/components/CategoryForm";

import {
  AdminLink,
  AdminPage,
  AdminState,
} from "@/features/admin/components/AdminPrimitives";

export default function EditCategoryPage() {
  const params =
    useParams<{ id: string }>();

  const [category, setCategory] =
    useState<AdminCategory | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    adminApi
      .category(params.id)
      .then(setCategory)
      .catch((value: unknown) =>
        setError(
          value instanceof Error
            ? value.message
            : "Unable to load category",
        ),
      );
  }, [params.id]);

  return (
    <AdminPage
      eyebrow="Catalogue / Categories"
      title="Edit category"
      description="Manage catalogue hierarchy, storefront imagery and category visibility."
      action={
        <AdminLink
          href="/admin/categories"
          variant="secondary"
        >
          Back to categories
        </AdminLink>
      }
    >
      {error ? (
        <AdminState error>
          {error}
        </AdminState>
      ) : category ? (
        <CategoryForm
          category={category}
        />
      ) : (
        <AdminState>
          Loading category...
        </AdminState>
      )}
    </AdminPage>
  );
}