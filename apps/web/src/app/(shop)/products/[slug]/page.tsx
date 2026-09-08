export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import ProductDetails from "./ProductDetails";

import { getProductBySlug } from "@/services/product";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  let product;

  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  return <ProductDetails product={product} />;
}