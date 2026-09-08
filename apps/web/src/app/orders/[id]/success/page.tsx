import Link from "next/link";

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
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-6 py-16">
      <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700">
          ✓
        </div>

        <p className="mt-8 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
          Order Confirmed
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
          Thank you for your order
        </h1>

        <p className="mx-auto mt-4 max-w-lg leading-7 text-neutral-600">
          Your order has been successfully
          placed. You can view its details from
          your order history.
        </p>

        <p className="mt-6 text-sm text-neutral-500">
          Order ID
        </p>

        <p className="mt-1 break-all font-mono text-sm font-semibold text-neutral-950">
          {id}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={`/orders/${id}`}
            className="rounded-xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            View Order
          </Link>

          <Link
            href="/shop"
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:border-neutral-950"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}