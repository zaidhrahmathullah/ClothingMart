import AdminGuard from "@/features/admin/components/AdminGuard";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-neutral-50">
        <AdminSidebar />

        <main className="min-h-screen min-w-0 lg:pl-[250px]">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}