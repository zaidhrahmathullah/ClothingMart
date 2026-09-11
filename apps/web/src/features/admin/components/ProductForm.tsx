"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { adminApi } from "@/features/admin/admin-api";
import type {
  AdminCategory,
  AdminProduct,
  AdminVariant,
} from "@/features/admin/admin-types";

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminState,
  buttonRowClass,
  inputClass,
} from "./AdminPrimitives";

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

type ProductImageDraft = {
  id?: string;
  imageUrl: string;
  altText: string;
  sortOrder: number;
};

type ProductDraft = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isNew: boolean;
  variants: AdminVariant[];
  images: ProductImageDraft[];
};

const emptyVariant: AdminVariant = {
  sku: "",
  size: "",
  color: "",
  price: "0",
  quantity: 0,
  isActive: true,
};

export default function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>({
    categoryId: product?.category.id ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    isNew: product?.isNew ?? false,
    variants: product?.variants.length ? product.variants : [{ ...emptyVariant }],
    images:
      product?.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        altText: image.altText ?? "",
        sortOrder: image.sortOrder,
      })) ?? [],
  });

  useEffect(() => {
    adminApi
      .categories({ limit: 100 })
      .then((value) => setCategories(value.categories))
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load categories",
        ),
      );
  }, []);

  function updateVariant(
    index: number,
    field: keyof AdminVariant,
    value: string | boolean,
  ) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [field]: field === "quantity" ? Number(value) : value,
            }
          : variant,
      ),
    }));
  }

  async function addImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;
    if (draft.images.length + files.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} images per product.`);
      return;
    }

    const invalidFile = files.find(
      (file) =>
        !ACCEPTED_IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_SIZE,
    );
    if (invalidFile) {
      setError(
        `${invalidFile.name} must be JPG, PNG, WebP, or GIF and no larger than 3 MB.`,
      );
      return;
    }

    try {
      const uploaded = await adminApi.uploadProductImages(files);
      const images = uploaded.images.map((image, index) => ({
        ...image,
        sortOrder: draft.images.length + index,
      }));
      setDraft((current) => ({
        ...current,
        images: [...current.images, ...images],
      }));
      setError("");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to add images",
      );
    }
  }

  function updateImage(
    index: number,
    field: "altText" | "sortOrder",
    value: string,
  ) {
    setDraft((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              [field]: field === "sortOrder" ? Number(value) : value,
            }
          : image,
      ),
    }));
  }

  function removeImage(index: number) {
    setDraft((current) => ({
      ...current,
      images: current.images
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({ ...image, sortOrder: imageIndex })),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      ...draft,
      images: draft.images.map(({ imageUrl, altText, sortOrder }) => ({
        imageUrl,
        altText: altText || undefined,
        sortOrder,
      })),
      variants: draft.variants.map((variant) => ({
        ...variant,
        price: Number(variant.price),
        quantity: Number(variant.quantity),
      })),
    };

    try {
      if (product) {
        await adminApi.updateProduct(product.id, body);
      } else {
        await adminApi.createProduct(body);
      }
      router.push("/admin/products");
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to save product",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <AdminState error>{error}</AdminState>}

      <AdminCard>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Name">
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
              className={inputClass}
            />
          </AdminField>
          <AdminField label="Slug">
            <input
              required
              value={draft.slug}
              onChange={(event) =>
                setDraft({ ...draft, slug: event.target.value })
              }
              className={inputClass}
            />
          </AdminField>
          <AdminField label="Category">
            <select
              required
              value={draft.categoryId}
              onChange={(event) =>
                setDraft({ ...draft, categoryId: event.target.value })
              }
              className={inputClass}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </AdminField>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={draft.isNew}
              onChange={(event) =>
                setDraft({ ...draft, isNew: event.target.checked })
              }
            />
            Mark as new
          </label>
        </div>
        <AdminField label="Description">
          <textarea
            rows={4}
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
            className={inputClass}
          />
        </AdminField>
      </AdminCard>

      <AdminCard>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold text-neutral-950">Product images</h2>
            <p className="text-sm text-neutral-500">
              Add up to {MAX_IMAGES} images. JPG, PNG, WebP, and GIF up to 3 MB each.
            </p>
          </div>
          <label className="inline-flex cursor-pointer rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800">
            Add images
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              multiple
              onChange={addImages}
              className="sr-only"
            />
          </label>
        </div>

        {draft.images.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            No images added yet.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {draft.images.map((image, index) => (
              <div
                key={image.id ?? `${image.imageUrl.slice(0, 20)}-${index}`}
                className="overflow-hidden rounded-lg border border-neutral-200"
              >
                <img
                  src={image.imageUrl}
                  alt={image.altText || "Product preview"}
                  className="aspect-square w-full object-cover"
                />
                <div className="space-y-3 p-3">
                  <AdminField label="Alt text">
                    <input
                      value={image.altText}
                      onChange={(event) =>
                        updateImage(index, "altText", event.target.value)
                      }
                      className={inputClass}
                      placeholder="Describe this image"
                    />
                  </AdminField>
                  <AdminField label="Sort order">
                    <input
                      type="number"
                      min="0"
                      value={image.sortOrder}
                      onChange={(event) =>
                        updateImage(index, "sortOrder", event.target.value)
                      }
                      className={inputClass}
                    />
                  </AdminField>
                  <AdminButton
                    type="button"
                    variant="danger"
                    onClick={() => removeImage(index)}
                  >
                    Remove image
                  </AdminButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-neutral-950">Variants</h2>
            <p className="text-sm text-neutral-500">
              Each product needs at least one variant.
            </p>
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() =>
              setDraft({
                ...draft,
                variants: [...draft.variants, { ...emptyVariant }],
              })
            }
          >
            Add variant
          </AdminButton>
        </div>
        <div className="mt-4 space-y-4">
          {draft.variants.map((variant, index) => (
            <div
              key={variant.id ?? index}
              className="grid gap-3 rounded-lg border border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-6"
            >
              <input
                required
                placeholder="SKU"
                value={variant.sku}
                onChange={(event) =>
                  updateVariant(index, "sku", event.target.value)
                }
                className={inputClass}
              />
              <input
                required
                placeholder="Size"
                value={variant.size}
                onChange={(event) =>
                  updateVariant(index, "size", event.target.value)
                }
                className={inputClass}
              />
              <input
                required
                placeholder="Color"
                value={variant.color}
                onChange={(event) =>
                  updateVariant(index, "color", event.target.value)
                }
                className={inputClass}
              />
              <input
                required
                min="0"
                step="0.01"
                type="number"
                placeholder="Price"
                value={variant.price}
                onChange={(event) =>
                  updateVariant(index, "price", event.target.value)
                }
                className={inputClass}
              />
              <input
                required
                min="0"
                step="1"
                type="number"
                placeholder="Stock"
                value={variant.quantity}
                onChange={(event) =>
                  updateVariant(index, "quantity", event.target.value)
                }
                className={inputClass}
              />
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(event) =>
                    updateVariant(index, "isActive", event.target.checked)
                  }
                />
                Active
              </label>
            </div>
          ))}
        </div>
      </AdminCard>

      <div className={buttonRowClass}>
        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving..." : product ? "Save changes" : "Create product"}
        </AdminButton>
      </div>
    </form>
  );
}
