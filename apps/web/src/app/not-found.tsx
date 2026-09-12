import Link from "next/link";
import Container from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container>
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 max-w-md text-neutral-600">The page you&apos;re looking for may have moved or no longer exists.</p>
        <div className="mt-8 flex gap-3">
          <Link className="rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white" href="/">Home</Link>
          <Link className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold" href="/shop">Shop</Link>
        </div>
      </section>
    </Container>
  );
}
