import { redirect } from "next/navigation";

import AccountShell from "@/features/account/components/AccountShell";
import AddressManager from "@/features/account/components/AddressManager";
import { serverApiFetch } from "@/lib/server-api";

import type { Address } from "@/types/address";
import type { AuthResponse } from "@/types/auth";

export const dynamic = "force-dynamic";

export default async function AddressesPage() {
  let auth: AuthResponse;
  let addresses: Address[];

  try {
    [auth, addresses] =
      await Promise.all([
        serverApiFetch<AuthResponse>(
          "/auth/me",
        ),
        serverApiFetch<Address[]>(
          "/addresses",
        ),
      ]);
  } catch {
    redirect(
      "/login?next=%2Faccount%2Faddresses",
    );
  }

  return (
    <AccountShell
      name={auth.user.name}
      email={auth.user.email}
      title="Saved Addresses"
      description="Add, edit and organize your delivery addresses for a faster checkout."
    >
      <AddressManager
        initialAddresses={addresses}
      />
    </AccountShell>
  );
}