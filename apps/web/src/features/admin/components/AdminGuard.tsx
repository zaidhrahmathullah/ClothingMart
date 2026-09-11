import { redirect } from "next/navigation";
import { serverApiFetch } from "@/lib/server-api";
import type { AuthResponse } from "@/types/auth";

export default async function AdminGuard({ children }: { children: React.ReactNode }) {
  try {
    const auth = await serverApiFetch<AuthResponse>("/auth/me");

    if (auth.user.role !== "ADMIN") {
      redirect("/");
    }

    return children;
  } catch {
    redirect("/login");
  }
}
