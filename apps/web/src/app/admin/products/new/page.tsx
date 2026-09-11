import { AdminPage } from "@/features/admin/components/AdminPrimitives";
import ProductForm from "@/features/admin/components/ProductForm";

export default function NewProductPage() {
  return (
    <AdminPage
      title="New product"
      description="Add a product and its first variants."
    >
      <ProductForm />
    </AdminPage>
  );
}
