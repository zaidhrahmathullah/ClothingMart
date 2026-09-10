"use client";

import { useEffect } from "react";

import Container from "@/components/ui/Container";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main>
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-semibold">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            We couldn&apos;t load the products right now.
          </p>

          <button
            type="button"
            onClick={() => reset()}
            className="mt-7 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      </Container>
    </main>
  );
}