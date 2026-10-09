import { apiFetch } from "@/lib/api";
import type {
  Product,
  ProductListResponse,
} from "@/types/product";

export type ProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: "true" | "false";
  sort?:
    | "newest"
    | "oldest"
    | "name_asc"
    | "name_desc"
    | "price_asc"
    | "price_desc";
};

export type ProductFacets = {
  sizes: string[];
  colors: string[];
};

function buildQuery(
  filters: ProductFilters = {},
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.set(key, String(value));
      }
    },
  );

  const query = params.toString();

  return query ? `?${query}` : "";
}

export async function getProductFacets(category?: string) {
  const query = category
    ? `?category=${encodeURIComponent(category)}`
    : "";

  return apiFetch<ProductFacets>(
    `/products/facets${query}`,
  );
}

export async function getProducts(
  filters?: ProductFilters,
) {
  return apiFetch<ProductListResponse>(
    `/products${buildQuery(filters)}`,
  );
}

export async function getProductBySlug(
  slug: string,
) {
  return apiFetch<Product>(
    `/products/${slug}`,
  );
}