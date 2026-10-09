"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageIcon,
  Upload,
} from "lucide-react";

import { adminApi } from "@/features/admin/admin-api";
import type { AdminCategory } from "@/features/admin/admin-types";

import {
  AdminButton,
  AdminCard,
  AdminField,
  AdminState,
  inputClass,
} from "./AdminPrimitives";

type CategoryImageRole =
  | "card"
  | "animation"
  | "banner";

const ACCEPTED_IMAGE_TYPES =
  "image/jpeg,image/png,image/webp,image/gif";

export default function CategoryForm({
  category,
}: {
  category?: AdminCategory;
}) {
  const router = useRouter();

  const [parentId, setParentId] =
    useState(category?.parentId ?? "");

  const [
    parentCategories,
    setParentCategories,
  ] = useState<AdminCategory[]>([]);

  const [
    loadingParents,
    setLoadingParents,
  ] = useState(true);

  const [name, setName] =
    useState(category?.name ?? "");

  const [slug, setSlug] =
    useState(category?.slug ?? "");

  const [description, setDescription] =
    useState(category?.description ?? "");

  const [
    cardImageUrl,
    setCardImageUrl,
  ] = useState(
    category?.cardImageUrl ?? "",
  );

  const [
    animationImageUrl,
    setAnimationImageUrl,
  ] = useState(
    category?.animationImageUrl ?? "",
  );

  const [
    bannerImageUrl,
    setBannerImageUrl,
  ] = useState(
    category?.bannerImageUrl ?? "",
  );

  const [
    uploadingRole,
    setUploadingRole,
  ] =
    useState<CategoryImageRole | null>(
      null,
    );

  const [isActive, setIsActive] =
    useState(
      category?.isActive ?? true,
    );

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadParentCategories() {
      try {
        setLoadingParents(true);

        const response =
          await adminApi.categories({
            page: 1,
            limit: 100,
          });

        if (cancelled) return;

        setParentCategories(
          response.categories.filter(
            (item) =>
              item.parentId === null &&
              item.isActive &&
              item.id !== category?.id,
          ),
        );
      } catch (value) {
        if (!cancelled) {
          setError(
            value instanceof Error
              ? value.message
              : "Unable to load parent categories",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingParents(false);
        }
      }
    }

    void loadParentCategories();

    return () => {
      cancelled = true;
    };
  }, [category?.id]);

  async function uploadCategoryImage(
    role: CategoryImageRole,
    file: File,
  ) {
    if (
      file.size >
      3 * 1024 * 1024
    ) {
      setError(
        "Category images must not exceed 3 MB.",
      );
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        "Please select a JPG, PNG, WebP or GIF image.",
      );
      return;
    }

    setUploadingRole(role);
    setError("");

    try {
      const result =
        await adminApi.uploadCategoryImages(
          [file],
        );

      const uploadedImage =
        result.images[0];

      if (!uploadedImage) {
        throw new Error(
          "The server did not return an uploaded image.",
        );
      }

      switch (role) {
        case "card":
          setCardImageUrl(
            uploadedImage.imageUrl,
          );
          break;

        case "animation":
          setAnimationImageUrl(
            uploadedImage.imageUrl,
          );
          break;

        case "banner":
          setBannerImageUrl(
            uploadedImage.imageUrl,
          );
          break;
      }
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to upload category image.",
      );
    } finally {
      setUploadingRole(null);
    }
  }

  async function submit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (uploadingRole !== null) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const body = {
        name,
        slug,
        parentId:
          parentId || null,
        description:
          description || undefined,
        cardImageUrl:
          cardImageUrl.trim() ||
          null,
        animationImageUrl:
          animationImageUrl.trim() ||
          null,
        bannerImageUrl:
          bannerImageUrl.trim() ||
          null,
        isActive,
      };

      if (category) {
        await adminApi.updateCategory(
          category.id,
          body,
        );
      } else {
        await adminApi.createCategory(
          body,
        );
      }

      router.push(
        "/admin/categories",
      );
      router.refresh();
    } catch (value) {
      setError(
        value instanceof Error
          ? value.message
          : "Unable to save category",
      );
    } finally {
      setSaving(false);
    }
  }

  const hasChildren =
    (category?.children?.length ??
      0) > 0;

  const categoryType = parentId
    ? "Subcategory"
    : "Main category";

  return (
    <form
      onSubmit={submit}
      className="space-y-5"
    >
      {error && (
        <AdminState error>
          {error}
        </AdminState>
      )}

      {/* Category structure */}
      <AdminCard>
        <SectionHeading
          eyebrow="Catalogue structure"
          title="Category details"
          description="Define the category identity and where it belongs within the ClothingMart catalogue."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <AdminField label="Category name">
            <input
              required
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
              }
              className={inputClass}
              placeholder="e.g. Shirts"
            />
          </AdminField>

          <AdminField label="Slug">
            <input
              required
              value={slug}
              onChange={(event) =>
                setSlug(
                  event.target.value,
                )
              }
              className={inputClass}
              placeholder="shirts"
            />
          </AdminField>

          <AdminField label="Parent category">
            <select
              value={parentId}
              onChange={(event) =>
                setParentId(
                  event.target.value,
                )
              }
              className={inputClass}
              disabled={
                loadingParents ||
                hasChildren
              }
            >
              <option value="">
                None — Main category
              </option>

              {parentCategories.map(
                (parent) => (
                  <option
                    key={parent.id}
                    value={parent.id}
                  >
                    {parent.name}
                  </option>
                ),
              )}
            </select>

            {loadingParents ? (
              <p className="mt-1.5 text-[10px] leading-4 text-neutral-500">
                Loading available
                parent categories...
              </p>
            ) : hasChildren ? (
              <p className="mt-1.5 border-l-2 border-amber-400 pl-2.5 text-[10px] leading-4 text-amber-700">
                This category already
                contains subcategories,
                so its parent cannot be
                changed.
              </p>
            ) : (
              <p className="mt-1.5 text-[10px] leading-4 text-neutral-500">
                Leave empty for a main
                category, or select a
                main category to create
                a subcategory.
              </p>
            )}
          </AdminField>

          <div>
            <p className="mb-1.5 text-xs font-medium text-neutral-700">
              Category status
            </p>

            <label className="flex min-h-[42px] cursor-pointer items-center justify-between gap-4 rounded border border-neutral-200 bg-neutral-50 px-3 py-2.5 transition-colors hover:border-neutral-300">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[12px] font-medium text-neutral-900">
                    {categoryType}
                  </p>

                  <span
                    className={`rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
                  Active categories can
                  appear throughout the
                  customer catalogue.
                </p>
              </div>

              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target
                      .checked,
                  )
                }
                className="h-4 w-4 shrink-0 accent-neutral-950"
              />
            </label>
          </div>
        </div>

        <div className="mt-4">
          <AdminField label="Description">
            <textarea
              rows={5}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              className={inputClass}
              placeholder="Describe this category and the products customers can discover here..."
            />
          </AdminField>
        </div>
      </AdminCard>

      {/* Category imagery */}
      <AdminCard>
        <SectionHeading
          eyebrow="Presentation"
          title="Category imagery"
          description="Manage the visual assets used across category cards, discovery experiences and category banners."
        />

        <p className="mt-4 border-l-2 border-neutral-300 pl-3 text-[11px] leading-5 text-neutral-500">
          JPG, PNG, WebP or GIF ·
          Maximum 3 MB per image ·
          Existing image URLs can also
          be entered manually.
        </p>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <CategoryImageEditor
            title="Card image"
            description="Used for compact category cards and catalogue navigation."
            value={cardImageUrl}
            onChange={
              setCardImageUrl
            }
            role="card"
            uploadingRole={
              uploadingRole
            }
            saving={saving}
            onUpload={
              uploadCategoryImage
            }
            previewClassName="aspect-[4/5]"
          />

          <CategoryImageEditor
            title="Animation image"
            description="Alternative visual for storefront motion or secondary category presentation."
            value={
              animationImageUrl
            }
            onChange={
              setAnimationImageUrl
            }
            role="animation"
            uploadingRole={
              uploadingRole
            }
            saving={saving}
            onUpload={
              uploadCategoryImage
            }
            previewClassName="aspect-[4/5]"
          />

          <CategoryImageEditor
            title="Banner image"
            description="Wide visual used to introduce the category on its catalogue page."
            value={bannerImageUrl}
            onChange={
              setBannerImageUrl
            }
            role="banner"
            uploadingRole={
              uploadingRole
            }
            saving={saving}
            onUpload={
              uploadCategoryImage
            }
            previewClassName="aspect-[16/7]"
          />
        </div>
      </AdminCard>

      {/* Save */}
      <div className="sticky bottom-3 z-20">
        <div className="flex flex-col gap-3 rounded border border-neutral-300 bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] font-semibold text-neutral-950">
              {category
                ? "Update category"
                : "Create category"}
            </p>

            <p className="mt-0.5 text-[10px] text-neutral-500">
              {categoryType} ·{" "}
              {isActive
                ? "Active"
                : "Inactive"}
            </p>
          </div>

          <AdminButton
            type="submit"
            disabled={
              saving ||
              uploadingRole !== null
            }
          >
            {saving
              ? "Saving..."
              : uploadingRole
                ? "Uploading image..."
                : category
                  ? "Save changes"
                  : "Create category"}
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
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-neutral-200 pb-4">
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

function CategoryImageEditor({
  title,
  description,
  value,
  onChange,
  role,
  uploadingRole,
  saving,
  onUpload,
  previewClassName,
}: {
  title: string;
  description: string;
  value: string;
  onChange: (
    value: string,
  ) => void;
  role: CategoryImageRole;
  uploadingRole:
    | CategoryImageRole
    | null;
  saving: boolean;
  onUpload: (
    role: CategoryImageRole,
    file: File,
  ) => Promise<void>;
  previewClassName: string;
}) {
  const uploading =
    uploadingRole === role;

  const disabled =
    uploadingRole !== null ||
    saving;

  return (
    <div className="overflow-hidden rounded border border-neutral-200 bg-white">
      <div className="relative flex min-h-44 items-center justify-center overflow-hidden bg-neutral-100">
        {value ? (
          <img
            src={value}
            alt={`${title} preview`}
            className={`${previewClassName} h-full w-full object-cover`}
          />
        ) : (
          <div className="px-5 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded bg-white text-neutral-400">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>

            <p className="mt-2.5 text-[11px] font-medium text-neutral-500">
              No image selected
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <p className="text-[11px] font-semibold text-neutral-700">
              Uploading...
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 p-3.5">
        <div>
          <h3 className="text-[12px] font-semibold text-neutral-950">
            {title}
          </h3>

          <p className="mt-1 min-h-8 text-[10px] leading-4 text-neutral-500">
            {description}
          </p>
        </div>

        <AdminField label="Image URL">
          <input
            type="text"
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value,
              )
            }
            placeholder="https://..."
            className={inputClass}
          />
        </AdminField>

        <label
          className={`flex min-h-9 items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition-colors ${
            disabled
              ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
              : "cursor-pointer border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950 hover:text-neutral-950"
          }`}
        >
          <Upload className="h-3.5 w-3.5" />

          {uploading
            ? "Uploading..."
            : value
              ? "Replace image"
              : "Upload image"}

          <input
            type="file"
            accept={
              ACCEPTED_IMAGE_TYPES
            }
            className="sr-only"
            disabled={disabled}
            onChange={(event) => {
              const file =
                event.target
                  .files?.[0];

              if (file) {
                void onUpload(
                  role,
                  file,
                );
              }

              event.target.value =
                "";
            }}
          />
        </label>

        {value && (
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() =>
              onChange("")
            }
          >
            Remove image
          </AdminButton>
        )}
      </div>
    </div>
  );
}