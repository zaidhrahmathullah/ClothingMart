"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminCategory } from "@/features/admin/admin-types";
import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminState,
  buttonRowClass,
  inputClass,
} from "./AdminPrimitives";

export default function CategoryForm({
  category,
}: {
  category?: AdminCategory;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name,
        slug,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        isActive,
      };
      if (category) await adminApi.updateCategory(category.id, body);
      else await adminApi.createCategory(body);
      router.push("/admin/categories");
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to save category",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <AdminCard>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Name">
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
          </AdminField>
          <AdminField label="Slug">
            <input
              required
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className={inputClass}
            />
          </AdminField>
          <AdminField label="Image URL">
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              className={inputClass}
            />
          </AdminField>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
            />{" "}
            Active
          </label>
        </div>
        <AdminField label="Description">
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={inputClass}
          />
        </AdminField>
      </AdminCard>
      {error && (
        <div className="mt-4">
          <AdminState error>{error}</AdminState>
        </div>
      )}
      <div className={buttonRowClass}>
        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving..." : category ? "Save changes" : "Create category"}
        </AdminButton>
      </div>
    </form>
  );
}
