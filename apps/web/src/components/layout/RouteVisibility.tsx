"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function RouteVisibility({
  children,
  hideOnAdmin = false,
}: {
  children: ReactNode;
  hideOnAdmin?: boolean;
}) {
  const pathname = usePathname();

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  if (hideOnAdmin && isAdminRoute) {
    return null;
  }

  return <>{children}</>;
}