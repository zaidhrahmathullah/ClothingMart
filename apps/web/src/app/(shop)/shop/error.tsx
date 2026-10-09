"use client";

import { useEffect } from "react";

import Container from "@/components/ui/Container";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="bg-white">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Shop unavailable
          </p>

          <h1 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-2xl">
            We couldn&apos;t load the collection
          </h1>

          <p className="mt-2 max-w-md text-[13px] leading-5 text-neutral-500">
            Something interrupted the product request.
            Try loading the shop again.
          </p>

          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-neutral-950"
          >
            Try again
          </button>
        </div>
      </Container>
    </main>
  );
}