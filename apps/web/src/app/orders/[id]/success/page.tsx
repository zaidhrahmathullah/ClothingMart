import {
  ArrowRight,
  Check,
  PackageCheck,
} from "lucide-react";
import Link from "next/link";

import Container from "@/components/ui/Container";

type SuccessPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderSuccessPage({
  params,
}: SuccessPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-neutral-50">
      <Container>
        <div className="flex min-h-[72vh] items-center justify-center py-10 sm:py-14">
          <section className="w-full max-w-xl overflow-hidden rounded border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-8 text-center sm:px-8 sm:py-10">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-emerald-50 text-emerald-700">
                <Check
                  aria-hidden="true"
                  className="h-5 w-5"
                  strokeWidth={2}
                />
              </div>

              <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Order Confirmed
              </p>

              <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Thank you for your order
              </h1>

              <p className="mx-auto mt-3 max-w-md text-[13px] leading-5 text-neutral-500">
                Your payment was completed and
                your order has been placed
                successfully.
              </p>
            </div>

            <div className="px-5 py-5 sm:px-8">
              <div className="flex items-start gap-3 rounded border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-white text-neutral-600">
                  <PackageCheck
                    aria-hidden="true"
                    className="h-4 w-4"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                    Order ID
                  </p>

                  <p className="mt-1 break-all font-mono text-[11px] font-medium leading-5 text-neutral-950">
                    {id}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-center text-[11px] leading-5 text-neutral-500">
                You can review your order,
                payment status, and delivery
                details from your order history.
              </p>

              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                <Link
                  href={`/orders/${id}`}
                  className="inline-flex items-center justify-center gap-2 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
                >
                  View Order

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>

                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded border border-neutral-300 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-950 transition-colors hover:border-neutral-950"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}