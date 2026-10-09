"use client";

import { useEffect, useRef, useState } from "react";
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

type EditableVariant = Omit<AdminVariant, "quantity"> & {
  quantity: number | "";
};

type ProductDraft = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  isNew: boolean;
  variants: EditableVariant[];
  images: ProductImageDraft[];
};

const emptyVariant: EditableVariant = {
  sku: "",
  size: "",
  color: "",
  price: "",
  discountedPrice: null,
  quantity: "",
  isActive: true,
};

export default function ProductForm({ product }: { product?: AdminProduct }) {
  const router = useRouter();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const initialStock = useRef(
    new Map(
      (product?.variants ?? [])
        .filter((variant) => Boolean(variant.id))
        .map((variant) => [variant.id!, variant.quantity]),
    ),
  );
  const [draft, setDraft] = useState<ProductDraft>({
    categoryId: product?.category.id ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    isNew: product?.isNew ?? false,
    variants: product?.variants.length ? product.variants : [{ ...emptyVariant }],
    images: normalizeImages(
      [...(product?.images ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          altText: image.altText ?? "",
          sortOrder: image.sortOrder,
        })),
    ),
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
    field: keyof EditableVariant,
    value: string | boolean,
  ) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index
          ? {
              ...variant,
              [field]:
                field === "quantity"
                  ? value === ""
                    ? ""
                    : Number(value)
                  : value,
            }
          : variant,
      ),
    }));
  }

  function removeVariant(index: number) {
    setDraft((current) => {
      if (current.variants.length <= 1) {
        return current;
      }

      const variant = current.variants[index];

      // Existing variants are retained for historical references.
      // Use the Active checkbox to discontinue them.
      if (variant.id) {
        return current;
      }

      return {
        ...current,
        variants: current.variants.filter(
          (_, variantIndex) => variantIndex !== index,
        ),
      };
    });
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
      setDraft((current) => ({
        ...current,
        images: normalizeImages([
          ...current.images,
          ...uploaded.images.map((image) => ({
            ...image,
            altText: image.altText ?? "",
            sortOrder: 0,
          })),
        ]),
      }));
      setError("");
    } catch (value) {
      setError(
        value instanceof Error ? value.message : "Unable to add images",
      );
    }
  }

  function normalizeImages(images: ProductImageDraft[]): ProductImageDraft[] {
    return images.map((image, index) => ({
      ...image,
      sortOrder: index,
    }));
  }

  function updateImageAltText(index: number, value: string) {
    setDraft((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index
          ? { ...image, altText: value }
          : image,
      ),
    }));
  }

  function moveImage(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const target = index + direction;

      if (target < 0 || target >= current.images.length) {
        return current;
      }

      const images = [...current.images];

      [images[index], images[target]] = [
        images[target],
        images[index],
      ];

      return {
        ...current,
        images: normalizeImages(images),
      };
    });
  }

  function setPrimaryImage(index: number) {
    setDraft((current) => {
      const images = [...current.images];
      const [selected] = images.splice(index, 1);

      images.unshift(selected);

      return {
        ...current,
        images: normalizeImages(images),
      };
    });
  }

  function removeImage(index: number) {
    setDraft((current) => ({
      ...current,
      images: normalizeImages(
        current.images.filter((_, imageIndex) => imageIndex !== index),
      ),
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const seenSkus = new Set<string>();
    const seenCombinations = new Set<string>();

    for (const [index, variant] of draft.variants.entries()) {
      const sku = variant.sku.trim().toLowerCase();

      const combination = JSON.stringify([
        variant.size.trim().toLowerCase(),
        variant.color.trim().toLowerCase(),
      ]);

      if (seenSkus.has(sku)) {
        setError(`Variant ${index + 1}: Duplicate SKU.`);
        return;
      }

      if (seenCombinations.has(combination)) {
        setError(
          `Variant ${index + 1}: Duplicate size and colour combination.`,
        );
        return;
      }

      seenSkus.add(sku);
      seenCombinations.add(combination);
    }

    for (let index = 0; index < draft.variants.length; index++) {
      const variant = draft.variants[index];
      const price = Number(variant.price);
      const quantity = Number(variant.quantity);
      const hasDiscount =
        variant.discountedPrice !== null &&
        String(variant.discountedPrice).trim() !== "";

      const discountedPrice = hasDiscount
        ? Number(variant.discountedPrice)
        : null;

      if (
        String(variant.price).trim() === "" ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setError(
          `Variant ${index + 1}: Enter a valid price of 0 or greater.`,
        );
        return;
      }

      if (
        discountedPrice !== null &&
        (!Number.isFinite(discountedPrice) ||
          discountedPrice < 0)
      ) {
        setError(
          `Variant ${index + 1}: Enter a valid discounted price of 0 or greater.`,
        );
        return;
      }

      if (
        discountedPrice !== null &&
        discountedPrice >= price
      ) {
        setError(
          `Variant ${index + 1}: Discounted price must be lower than the regular price.`,
        );
        return;
      }

      if (
        variant.quantity === "" ||
        !Number.isSafeInteger(quantity) ||
        quantity < 0
      ) {
        setError(
          `Variant ${index + 1}: Enter a valid whole-number stock quantity.`,
        );
        return;
      }
    }

    setSaving(true);

    const body = {
      ...draft,
      images: draft.images.map(
        ({ id, imageUrl, altText }, index) => ({
          ...(id ? { id } : {}),
          imageUrl,
          altText: altText || undefined,
          sortOrder: index,
        }),
      ),
      variants: draft.variants.map((variant) => {
        const quantity = Number(variant.quantity);

        if (!variant.id) {
          return {
            ...variant,
            price: Number(variant.price),
            discountedPrice:
              variant.discountedPrice === null ||
              String(variant.discountedPrice).trim() === ""
                ? null
                : Number(variant.discountedPrice),
            quantity,
          };
        }

        const originalQuantity = initialStock.current.get(variant.id);

        return {
          id: variant.id,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          price: Number(variant.price),
          discountedPrice:
            variant.discountedPrice === null ||
            String(variant.discountedPrice).trim() === ""
              ? null
              : Number(variant.discountedPrice),
          isActive: variant.isActive,

          ...(originalQuantity !== undefined &&
          quantity !== originalQuantity
            ? {
                quantity,
                expectedQuantity: originalQuantity,
              }
            : {}),
        };
      }),
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

  const mainCategories = categories.filter(
    (category) => category.parentId === null,
  );

  const selectedCategory = categories.find(
    (category) => category.id === draft.categoryId,
  );

  const isLegacyMainCategory =
    selectedCategory?.parentId === null &&
    product?.category.id === selectedCategory.id;

    return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <AdminState error>
          {error}
        </AdminState>
      )}

      {/* Product information */}
      <AdminCard>
        <SectionHeading
          eyebrow="Product information"
          title="Catalogue details"
          description="Define how this product is identified and organised in the ClothingMart catalogue."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <AdminField label="Product name">
            <input
              required
              value={draft.name}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  name: event.target.value,
                })
              }
              className={inputClass}
              placeholder="e.g. Classic Oxford Shirt"
            />
          </AdminField>

          <AdminField label="Slug">
            <input
              required
              value={draft.slug}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  slug: event.target.value,
                })
              }
              className={inputClass}
              placeholder="classic-oxford-shirt"
            />
          </AdminField>

          <AdminField label="Product subcategory">
            <select
              required
              value={draft.categoryId}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  categoryId: event.target.value,
                })
              }
              className={inputClass}
            >
              <option value="">
                Select a subcategory
              </option>

              {isLegacyMainCategory &&
                selectedCategory && (
                  <option
                    value={selectedCategory.id}
                  >
                    {selectedCategory.name} (existing
                    legacy assignment)
                  </option>
                )}

              {mainCategories
                .filter(
                  (main) => main.isActive,
                )
                .map((main) => {
                  const children =
                    categories.filter(
                      (category) =>
                        category.parentId ===
                          main.id &&
                        category.isActive,
                    );

                  if (
                    children.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <optgroup
                      key={main.id}
                      label={main.name}
                    >
                      {children.map(
                        (child) => (
                          <option
                            key={child.id}
                            value={child.id}
                          >
                            {child.name}
                          </option>
                        ),
                      )}
                    </optgroup>
                  );
                })}
            </select>

            <p className="mt-1.5 text-[11px] leading-4 text-neutral-500">
              Products belong to an active
              subcategory. Main categories are
              shown as groups.
            </p>
          </AdminField>

          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-700">
              Merchandising
            </p>

            <label className="flex min-h-[42px] cursor-pointer items-center justify-between gap-4 rounded border border-neutral-200 bg-neutral-50 px-3 py-2.5 transition-colors hover:border-neutral-300">
              <div>
                <p className="text-[12px] font-medium text-neutral-900">
                  Mark as new
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
                  Highlight as a new arrival.
                </p>
              </div>

              <input
                type="checkbox"
                checked={draft.isNew}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    isNew:
                      event.target.checked,
                  })
                }
                className="h-4 w-4 accent-neutral-950"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <AdminField label="Description">
            <textarea
              rows={5}
              value={draft.description}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  description:
                    event.target.value,
                })
              }
              className={inputClass}
              placeholder="Describe the product, materials, fit and important details..."
            />
          </AdminField>
        </div>
      </AdminCard>

      {/* Product imagery */}
      <AdminCard>
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Media"
            title="Product imagery"
            description={`Add up to ${MAX_IMAGES} images. The first image is used as the primary catalogue image.`}
            border={false}
          />

          <label className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center rounded bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800">
            Add images

            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(
                ",",
              )}
              multiple
              onChange={addImages}
              className="sr-only"
            />
          </label>
        </div>

        <p className="mt-4 border-l-2 border-neutral-300 pl-3 text-[11px] leading-5 text-neutral-500">
          JPG, PNG, WebP or GIF · Maximum 3 MB
          per image · Use the controls below to
          change image order.
        </p>

        {draft.images.length === 0 ? (
          <div className="mt-4 flex min-h-36 items-center justify-center rounded border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
            <div>
              <p className="text-[12px] font-semibold text-neutral-700">
                No product images yet
              </p>

              <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                Add product photography to make
                this item visible throughout the
                storefront.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {draft.images.map(
              (image, index) => (
                <div
                  key={
                    image.id ??
                    `${image.imageUrl.slice(
                      0,
                      20,
                    )}-${index}`
                  }
                  className="overflow-hidden rounded border border-neutral-200 bg-white"
                >
                  <div className="relative bg-neutral-100">
                    <img
                      src={image.imageUrl}
                      alt={
                        image.altText ||
                        "Product preview"
                      }
                      className="aspect-[4/5] w-full object-cover"
                    />

                    <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded bg-white/95 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-neutral-600">
                        Image {index + 1}
                      </span>

                      {index === 0 && (
                        <span className="rounded bg-neutral-950 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-white">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 p-3.5">
                    <AdminField label="Alt text">
                      <input
                        value={image.altText}
                        onChange={(event) =>
                          updateImageAltText(
                            index,
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Describe this product image"
                      />
                    </AdminField>

                    <div className="grid grid-cols-2 gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        disabled={index === 0}
                        onClick={() =>
                          moveImage(index, -1)
                        }
                      >
                        ← Earlier
                      </AdminButton>

                      <AdminButton
                        type="button"
                        variant="secondary"
                        disabled={
                          index ===
                          draft.images.length - 1
                        }
                        onClick={() =>
                          moveImage(index, 1)
                        }
                      >
                        Later →
                      </AdminButton>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {index !== 0 && (
                        <AdminButton
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setPrimaryImage(
                              index,
                            )
                          }
                        >
                          Set primary
                        </AdminButton>
                      )}

                      <AdminButton
                        type="button"
                        variant="danger"
                        onClick={() =>
                          removeImage(index)
                        }
                      >
                        Remove
                      </AdminButton>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </AdminCard>

      {/* Variants */}
      <AdminCard>
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Commerce"
            title="Variants, pricing & stock"
            description="Each size and colour combination needs its own SKU, pricing and inventory quantity."
            border={false}
          />

          <AdminButton
            type="button"
            variant="secondary"
            onClick={() =>
              setDraft({
                ...draft,
                variants: [
                  ...draft.variants,
                  { ...emptyVariant },
                ],
              })
            }
          >
            + Add variant
          </AdminButton>
        </div>

        <div className="mt-4 space-y-3">
          {draft.variants.map(
            (variant, index) => {
              const regularPrice =
                Number(variant.price);

              const discountedPrice =
                variant.discountedPrice ===
                  null ||
                String(
                  variant.discountedPrice,
                ).trim() === ""
                  ? null
                  : Number(
                      variant.discountedPrice,
                    );

              const validDiscount =
                Number.isFinite(
                  regularPrice,
                ) &&
                Number.isFinite(
                  discountedPrice,
                ) &&
                discountedPrice !== null &&
                discountedPrice >= 0 &&
                discountedPrice <
                  regularPrice;

              const discountPercent =
                validDiscount &&
                regularPrice > 0
                  ? Math.round(
                      ((regularPrice -
                        discountedPrice) /
                        regularPrice) *
                        100,
                    )
                  : null;

              return (
                <div
                  key={variant.id ?? index}
                  className="overflow-hidden rounded border border-neutral-200 bg-neutral-50/50"
                >
                  <div className="flex flex-col gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="text-[12px] font-semibold text-neutral-950">
                          Variant {index + 1}
                        </h3>

                        <span
                          className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                            variant.id
                              ? "bg-neutral-100 text-neutral-600"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {variant.id
                            ? "Existing"
                            : "New"}
                        </span>

                        {discountPercent !==
                          null && (
                          <span className="rounded bg-emerald-50 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                            {discountPercent}% off
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-[10px] text-neutral-500">
                        {variant.sku ||
                          "SKU not entered"}

                        {variant.size
                          ? ` · ${variant.size}`
                          : ""}

                        {variant.color
                          ? ` · ${variant.color}`
                          : ""}
                      </p>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-neutral-700">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "isActive",
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 accent-neutral-950"
                      />

                      Active
                    </label>
                  </div>

                  <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                    <AdminField label="SKU">
                      <input
                        required
                        placeholder="e.g. SHIRT-BLK-M"
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "sku",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </AdminField>

                    <AdminField label="Size">
                      <input
                        required
                        placeholder="e.g. M"
                        value={variant.size}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "size",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </AdminField>

                    <AdminField label="Colour">
                      <input
                        required
                        placeholder="e.g. Black"
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "color",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </AdminField>

                    <AdminField label="Regular price">
                      <input
                        required
                        min="0"
                        step="0.01"
                        type="number"
                        placeholder="0.00"
                        value={variant.price}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "price",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />
                    </AdminField>

                    <AdminField label="Discounted price">
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        placeholder="Optional"
                        value={
                          variant.discountedPrice ??
                          ""
                        }
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "discountedPrice",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />

                      <p className="mt-1.5 text-[10px] leading-4 text-neutral-500">
                        Optional. Must be lower
                        than the regular price.
                      </p>
                    </AdminField>

                    <AdminField label="Stock quantity">
                      <input
                        required
                        min="0"
                        step="1"
                        type="number"
                        placeholder="0"
                        value={variant.quantity}
                        onChange={(event) =>
                          updateVariant(
                            index,
                            "quantity",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                      />

                      {variant.id && (
                        <p className="mt-1.5 text-[10px] leading-4 text-neutral-500">
                          Existing stock changes
                          retain concurrency
                          protection.
                        </p>
                      )}
                    </AdminField>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-neutral-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-2xl text-[10px] leading-4 text-neutral-500">
                      {variant.id &&
                      !variant.isActive ? (
                        <p>
                          This variant is
                          discontinued. Historical
                          orders and its inventory
                          record remain preserved.
                        </p>
                      ) : variant.id ? (
                        <p>
                          Existing variant —
                          deactivate it rather than
                          deleting it when
                          discontinuing this option.
                        </p>
                      ) : (
                        <p>
                          New variants can be
                          removed before the product
                          is saved.
                        </p>
                      )}
                    </div>

                    {!variant.id &&
                      draft.variants.length >
                        1 && (
                        <AdminButton
                          type="button"
                          variant="danger"
                          onClick={() =>
                            removeVariant(index)
                          }
                        >
                          Remove variant
                        </AdminButton>
                      )}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </AdminCard>

      {/* Save bar */}
      <div className="sticky bottom-3 z-20">
        <div className="flex flex-col gap-3 rounded border border-neutral-300 bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-neutral-950">
              {product
                ? "Update product"
                : "Create product"}
            </p>

            <p className="mt-0.5 text-[10px] text-neutral-500">
              {draft.variants.length}{" "}
              {draft.variants.length === 1
                ? "variant"
                : "variants"}{" "}
              · {draft.images.length} of{" "}
              {MAX_IMAGES} images
            </p>
          </div>

          <AdminButton
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : product
                ? "Save changes"
                : "Create product"}
          </AdminButton>
        </div>
      </div>
    </form>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  border = true,
}: {
  eyebrow: string;
  title: string;
  description: string;
  border?: boolean;
}) {
  return (
    <div
      className={
        border
          ? "border-b border-neutral-200 pb-4"
          : ""
      }
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950">
        {title}
      </h2>

      <p className="mt-1 max-w-2xl text-[11px] leading-5 text-neutral-500">
        {description}
      </p>
    </div>
  );
}