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
    <nav className="mt-12 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={pageHref(currentPage - 1)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-neutral-950"
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
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            page === currentPage
              ? "bg-neutral-950 text-white"
              : "border border-neutral-300 hover:border-neutral-950"
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={pageHref(currentPage + 1)}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:border-neutral-950"
        >
          Next
        </Link>
      )}
    </nav>
  );
}