export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import ProductDetails from "./ProductDetails";

import { serverApiFetch } from "@/lib/server-api";
import type { Product } from "@/types/product";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProduct(slug: string) {
  return serverApiFetch<Product>(
    `/products/${encodeURIComponent(slug)}`,
  );
}

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  return <ProductDetails product={product} />;
}

export async function generateMetadata({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProduct(slug);
  } catch {
    return {
      title: "Product | ClothingMart",
    };
  }

  if (!product) {
    return {
      title: "Product Not Found | ClothingMart",
    };
  }

  return {
    title: `${product.name} | ClothingMart`,
    description:
      product.description ??
      `Shop ${product.name} at ClothingMart.`,
  };
}