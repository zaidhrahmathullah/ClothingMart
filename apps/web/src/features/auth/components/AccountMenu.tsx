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

export default function AccountMenu({
  user,
}: AccountMenuProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  function openMenu() {
    setIsOpen(true);
  }

  function closeMenu() {
    if (!isLoggingOut) {
      setIsOpen(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;

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
    <div
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        onFocus={openMenu}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-1 py-[18px] text-[13px] font-medium text-neutral-600 transition-colors hover:text-neutral-950 focus-visible:outline-none"
      >
        Account

        <ChevronDown
          aria-hidden="true"
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 w-56 pt-1.5">
          <div
            role="menu"
            className="overflow-hidden rounded border border-neutral-200 bg-white shadow-lg"
          >
            <div className="border-b border-neutral-100 px-4 py-3">
              <p className="truncate text-[13px] font-semibold text-neutral-950">
                {user.name}
              </p>

              <p className="mt-0.5 truncate text-xs text-neutral-500">
                {user.email}
              </p>
            </div>

            <div className="py-1.5">
              <Link
                href="/account"
                role="menuitem"
                onClick={closeMenu}
                className="block px-4 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
              >
                My Account
              </Link>

              <Link
                href="/orders"
                role="menuitem"
                onClick={closeMenu}
                className="block px-4 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
              >
                My Orders
              </Link>

              <Link
                href="/wishlist"
                role="menuitem"
                onClick={closeMenu}
                className="block px-4 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-950"
              >
                Wishlist
              </Link>
            </div>

            <div className="border-t border-neutral-100 py-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full px-4 py-2 text-left text-[13px] font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}