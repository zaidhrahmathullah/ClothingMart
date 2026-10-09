"use client";

import {
  Heart,
  House,
  MapPin,
  Package,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
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
    label: "Profile",
    href: "/account/profile",
    icon: ShieldCheck,
  },
];

export default function AccountMobileNav() {
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto border-b border-neutral-200 pb-2 lg:hidden">
      <nav className="flex min-w-max gap-1">
        {items.map((item) => {
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
              className={`inline-flex items-center gap-1.5 rounded px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              <Icon
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />

              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}