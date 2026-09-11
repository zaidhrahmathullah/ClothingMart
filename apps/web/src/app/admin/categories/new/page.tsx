import { AdminPage } from "@/features/admin/components/AdminPrimitives";
import CategoryForm from "@/features/admin/components/CategoryForm";

export default function NewCategoryPage() {
  return (
    <AdminPage
      title="New category"
      description="Create a collection for your catalogue."
    >
      <CategoryForm />
    </AdminPage>
  );
}
