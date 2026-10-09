import {
  AdminLink,
  AdminPage,
} from "@/features/admin/components/AdminPrimitives";
import CategoryForm from "@/features/admin/components/CategoryForm";

export default function NewCategoryPage() {
  return (
    <AdminPage
      eyebrow="Catalogue / Categories"
      title="Create category"
      description="Create a main category or subcategory and define how it is presented throughout the storefront."
      action={
        <AdminLink
          href="/admin/categories"
          variant="secondary"
        >
          Back to categories
        </AdminLink>
      }
    >
      <CategoryForm />
    </AdminPage>
  );
}