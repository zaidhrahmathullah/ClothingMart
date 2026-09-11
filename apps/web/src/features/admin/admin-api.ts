import { apiFetch, apiUpload } from "@/lib/api";
import type {
  AdminCategory,
  AdminCategoryList,
  AdminCustomerDetail,
  AdminCustomerList,
  AdminDashboard,
  AdminInventoryList,
  AdminOrder,
  AdminOrderList,
  AdminProduct,
  AdminProductList,
  OrderStatus,
} from "./admin-types";

function query(params: Record<string, string | number | boolean | undefined>) {
  const value = new URLSearchParams();
  Object.entries(params).forEach(([key, item]) => {
    if (item !== undefined && item !== "") value.set(key, String(item));
  });
  const result = value.toString();
  return result ? `?${result}` : "";
}
export const adminApi = {
  uploadProductImages: (files: File[]) => {
    const body = new FormData();
    files.forEach((file) => body.append("images", file));
    return apiUpload<{
      images: { imageUrl: string; altText: string; sortOrder: number }[];
    }>("/admin/uploads/product-images", body);
  },

  dashboard: () => apiFetch<AdminDashboard>("/admin/dashboard"),
  
  products: (
    params: Record<string, string | number | boolean | undefined> = {},
  ) => apiFetch<AdminProductList>(`/admin/products${query(params)}`),
  
  product: (id: string) => apiFetch<AdminProduct>(`/admin/products/${id}`),
  
  createProduct: (body: unknown) =>
    apiFetch<AdminProduct>("/admin/products", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProduct: (id: string, body: unknown) =>
    apiFetch<AdminProduct>(`/admin/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  deactivateProduct: (id: string) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/deactivate`, {
      method: "POST",
    }),

  activateProduct: (id: string) =>
    apiFetch<AdminProduct>(`/admin/products/${id}/activate`, {
      method: "POST",
    }),

  categories: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<AdminCategoryList>(`/admin/categories${query(params)}`),

  category: (id: string) => apiFetch<AdminCategory>(`/admin/categories/${id}`),

  createCategory: (body: unknown) =>
    apiFetch<AdminCategory>("/admin/categories", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateCategory: (id: string, body: unknown) =>
    apiFetch<AdminCategory>(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  inventory: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<AdminInventoryList>(`/admin/inventory${query(params)}`),

  updateInventory: (id: string, quantity: number) =>
    apiFetch<{ id: string; quantity: number }>(`/admin/inventory/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    }),

  orders: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<AdminOrderList>(`/admin/orders${query(params)}`),

  order: (id: string) => apiFetch<AdminOrder>(`/admin/orders/${id}`),

  updateOrderStatus: (id: string, status: OrderStatus) =>
    apiFetch<AdminOrder>(`/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  customers: (params: Record<string, string | number | undefined> = {}) =>
    apiFetch<AdminCustomerList>(`/admin/customers${query(params)}`),
  
  customer: (id: string) =>
    apiFetch<AdminCustomerDetail>(`/admin/customers/${id}`),
};
