"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { logout } from "@/services/auth";
import type { AuthUser } from "@/types/auth";

type AccountMenuProps = {
  user: AuthUser;
};

export default function AccountMenu({ user }: AccountMenuProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();

      setIsOpen(false);

      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-950"
      >
        Account
        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
          />

          <div
            role="menu"
            className="absolute right-0 z-50 mt-3 w-52 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg"
          >
            <div className="border-b border-neutral-100 px-3 py-2">
              <p className="text-sm font-semibold text-neutral-950">
                {user.name}
              </p>

              <p className="truncate text-xs text-neutral-500">
                {user.email}
              </p>
            </div>

            <Link
              href="/account"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="mt-1 block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              My Account
            </Link>

            <Link
              href="/orders"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
            >
              My Orders
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}