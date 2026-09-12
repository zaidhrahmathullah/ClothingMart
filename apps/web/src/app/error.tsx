"use client";

import { useEffect } from "react";
import Container from "@/components/ui/Container";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <Container>
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-semibold">We couldn&apos;t load this page</h1>
        <p className="mt-3 max-w-md text-neutral-600">Please try again. If the problem continues, return to the shop and try later.</p>
        <button type="button" onClick={reset} className="mt-8 rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">Try again</button>
      </section>
    </Container>
  );
}
