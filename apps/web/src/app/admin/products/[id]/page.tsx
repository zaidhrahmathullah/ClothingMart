"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/features/admin/admin-api";
import type { AdminProduct } from "@/features/admin/admin-types";
import ProductForm from "@/features/admin/components/ProductForm";
import {
  AdminPage,
  AdminState,
} from "@/features/admin/components/AdminPrimitives";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    adminApi
      .product(params.id)
      .then(setProduct)
      .catch((value: unknown) =>
        setError(
          value instanceof Error ? value.message : "Unable to load product",
        ),
      );
  }, [params.id]);
  return (
    <AdminPage
      title="Edit product"
      description="Update product information and variants."
    >
      {error ? (
        <AdminState error>{error}</AdminState>
      ) : product ? (
        <ProductForm product={product} />
      ) : (
        <AdminState>Loading product...</AdminState>
      )}
    </AdminPage>
  );
}
