import AdminGuard from "@/features/admin/components/AdminGuard";
import AdminSidebar from "@/features/admin/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-neutral-50">
        <div className="flex flex-col lg:flex-row">
          <AdminSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
