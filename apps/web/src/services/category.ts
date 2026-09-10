import { apiFetch } from "@/lib/api";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export type CategoryWithProducts = Category & {
  products: Product[];
};

export async function getCategories() {
  return apiFetch<Category[]>("/categories");
}

export async function getCategoryProducts(
  slug: string,
): Promise<CategoryWithProducts | null> {
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return null;
  }

  const products = await apiFetch<Product[]>(
    `/categories/${slug}/products`,
  );

  return {
    ...category,
    products,
  };
}

