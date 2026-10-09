import { apiFetch } from "@/lib/api";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export type CategoryWithProducts = Category & {
  products: Product[];
};

export async function getCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export function findCategoryBySlug(
  categories: Category[],
  slug: string,
): Category | null {
  for (const category of categories) {
    if (category.slug === slug) {
      return category;
    }

    const child = category.children?.find(
      (item) => item.slug === slug,
    );

    if (child) {
      return child;
    }
  }

  return null;
}

export function flattenCategories(
  categories: Category[],
): Category[] {
  return categories.flatMap((category) => [
    category,
    ...(category.children ?? []),
  ]);
}

export async function getCategoryProducts(
  slug: string,
): Promise<CategoryWithProducts | null> {
  const categories = await getCategories();
  const category = findCategoryBySlug(categories, slug);

  if (!category) return null;

  const products = await apiFetch<Product[]>(
    `/categories/${encodeURIComponent(slug)}/products`,
  );

  return {
    ...category,
    products,
  };
}