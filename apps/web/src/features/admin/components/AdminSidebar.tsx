"use client";

import {
  ArrowUpRight,
  Boxes,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingBag,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  {
    label: "Dashboard",
    description: "Store overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    description: "Catalogue management",
    href: "/admin/products",
    icon: Package,
  },
  {
    label: "Categories",
    description: "Store organization",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    label: "Inventory",
    description: "Stock control",
    href: "/admin/inventory",
    icon: Boxes,
  },
  {
    label: "Orders",
    description: "Fulfilment & payments",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    label: "Customers",
    description: "Customer accounts",
    href: "/admin/customers",
    icon: Users,
  },
];

function isNavigationActive(
  pathname: string,
  href: string,
) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-neutral-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <Link
          href="/admin"
          className="flex min-w-0 items-center gap-2.5"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-950 text-white">
            <Store className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold tracking-tight text-neutral-950">
              ClothingMart
            </p>

            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Admin Workspace
            </p>
          </div>
        </Link>

        <button
          type="button"
          aria-label="Open admin navigation"
          aria-expanded={mobileOpen}
          onClick={() =>
            setMobileOpen(true)
          }
          className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        aria-hidden={!mobileOpen}
        onClick={() =>
          setMobileOpen(false)
        }
        className={`fixed inset-0 z-50 bg-neutral-950/40 backdrop-blur-sm transition-opacity lg:hidden ${
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Desktop sidebar / mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,300px)] flex-col border-r border-neutral-200 bg-white transition-transform duration-300 lg:z-40 lg:w-[250px] lg:translate-x-0 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex h-[76px] items-center justify-between border-b border-neutral-200 px-4 lg:px-5">
          <Link
            href="/admin"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex min-w-0 items-center gap-2.5"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-neutral-950 text-white">
              <Store className="h-3.5 w-3.5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.01em] text-neutral-950">
                ClothingMart
              </p>

              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Admin Workspace
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() =>
              setMobileOpen(false)
            }
            className="flex h-8 w-8 items-center justify-center rounded border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-950 hover:text-neutral-950 lg:hidden"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Management
          </p>

          <nav className="mt-2.5 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              const active =
                isNavigationActive(
                  pathname,
                  item.href,
                );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  aria-current={
                    active
                      ? "page"
                      : undefined
                  }
                  className={`group relative flex min-h-[52px] items-center gap-2.5 rounded px-2.5 py-2 transition-colors ${
                    active
                      ? "bg-neutral-100 text-neutral-950"
                      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
                  }`}
                >
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-neutral-950"
                    />
                  )}

                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded transition-colors ${
                      active
                        ? "bg-white text-neutral-950"
                        : "bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-800"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-4">
                      {item.label}
                    </p>

                    <p className="mt-0.5 truncate text-[10px] leading-4 text-neutral-400">
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                      active
                        ? "text-neutral-500"
                        : "text-neutral-300 group-hover:text-neutral-500"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Storefront */}
        <div className="border-t border-neutral-200 p-3">
          <div className="rounded border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white text-neutral-600">
                <Store className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-neutral-950">
                  Storefront
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-neutral-500">
                  Preview the customer
                  shopping experience.
                </p>
              </div>
            </div>

            <Link
              href="/"
              onClick={() =>
                setMobileOpen(false)
              }
              className="mt-3 flex min-h-8 items-center justify-between rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
            >
              <span>View Store</span>

              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}