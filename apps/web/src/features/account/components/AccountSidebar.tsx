"use client";

import {
  Heart,
  House,
  LogOut,
  MapPin,
  Package,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useState } from "react";

import { logout } from "@/services/auth";

const navigation = [
  {
    label: "Overview",
    href: "/account",
    icon: House,
  },
  {
    label: "Orders",
    href: "/orders",
    icon: Package,
  },
  {
    label: "Addresses",
    href: "/account/addresses",
    icon: MapPin,
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    icon: Heart,
  },
  {
    label: "Profile & Security",
    href: "/account/profile",
    icon: ShieldCheck,
  },
];

type AccountSidebarProps = {
  name: string;
  email: string;
};

export default function AccountSidebar({
  name,
  email,
}: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();

      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <aside className="overflow-hidden rounded border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-neutral-950 text-white">
          <UserRound
            aria-hidden="true"
            className="h-[17px] w-[17px]"
          />
        </div>

        <p className="mt-3 truncate text-[13px] font-semibold text-neutral-950">
          {name}
        </p>

        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
          {email}
        </p>
      </div>

      <nav className="px-2 py-2">
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname === item.href ||
                pathname.startsWith(
                  `${item.href}/`,
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded border-l-2 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "border-neutral-950 bg-neutral-50 text-neutral-950"
                  : "border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              <Icon
                aria-hidden="true"
                className="h-[17px] w-[17px]"
              />

              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2.5 rounded border-l-2 border-transparent px-3 py-2.5 text-left text-[13px] font-medium text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut
            aria-hidden="true"
            className="h-[17px] w-[17px]"
          />

          {loggingOut
            ? "Signing out..."
            : "Sign Out"}
        </button>
      </div>
    </aside>
  );
}