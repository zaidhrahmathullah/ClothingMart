import {
  AdminLink,
  AdminPage,
} from "@/features/admin/components/AdminPrimitives";
import ProductForm from "@/features/admin/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminPage
      eyebrow="Catalogue / Products"
      title="Create product"
      description="Build a new catalogue item with imagery, variant pricing and inventory."
      action={
        <AdminLink
          href="/admin/products"
          variant="secondary"
        >
          Back to products
        </AdminLink>
      }
    >
      <ProductForm />
    </AdminPage>
  );
}