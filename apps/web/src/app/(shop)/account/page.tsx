import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthResponse } from "@/types/auth";

export default async function AccountPage() {
  let auth: AuthResponse;

  try {
    auth = await serverApiFetch<AuthResponse>("/auth/me");
  } catch {
    redirect("/login");
  }

  const { user } = auth;

  return (
    <main className="min-h-screen bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 p-8 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            My Account
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Welcome, {user.name}
          </h1>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium text-gray-900">
                {user.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {user.email}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium text-gray-900">
                {user.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}