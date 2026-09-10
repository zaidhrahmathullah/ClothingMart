import Link from "next/link";

import Container from "@/components/ui/Container";

export default function ProductNotFound() {
  return (
    <main>
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <p className="text-sm font-semibold text-neutral-400">
            404
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Product not found
          </h1>

          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
            The product you&apos;re looking for may have been removed
            or the link may be incorrect.
          </p>

          <Link
            href="/shop"
            className="mt-7 rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Back to Shop
          </Link>
        </div>
      </Container>
    </main>
  );
}