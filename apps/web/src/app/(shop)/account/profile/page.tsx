import { redirect } from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import ProfileManager from "@/features/account/components/ProfileManager";
import { serverApiFetch } from "@/lib/server-api";

import type {
  AuthResponse,
} from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  let auth: AuthResponse;

  try {
    auth =
      await serverApiFetch<AuthResponse>(
        "/auth/me",
      );
  } catch {
    redirect(
      "/login?next=%2Faccount%2Fprofile",
    );
  }

  return (
    <AccountShell
      name={auth.user.name}
      email={auth.user.email}
      title="Profile & Security"
      description="Manage your personal information and protect your ClothingMart account."
    >
      <ProfileManager
        user={auth.user}
      />
    </AccountShell>
  );
}