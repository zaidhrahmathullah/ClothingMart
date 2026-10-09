"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";

type ProductPaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function ProductPagination({
  currentPage,
  totalPages,
}: ProductPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  function pageHref(page: number) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    params.set("page", String(page));

    return `${pathname}?${params.toString()}`;
  }

  return (
    <nav
      aria-label="Product pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5"
    >
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          Previous
        </Link>
      )}

      {Array.from(
        { length: totalPages },
        (_, index) => index + 1,
      ).map((page) => (
        <Link
          key={page}
          href={pageHref(page)}
          aria-current={
            page === currentPage ? "page" : undefined
          }
          className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-xs font-medium transition-colors ${
            page === currentPage
              ? "bg-neutral-950 text-white"
              : "border border-neutral-300 text-neutral-700 hover:border-neutral-950"
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950"
        >
          Next
        </Link>
      )}
    </nav>
  );
}