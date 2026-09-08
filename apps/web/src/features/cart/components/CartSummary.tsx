import Link from "next/link";

type CartSummaryProps = {
  subtotal: string;
};

export default function CartSummary({
  subtotal,
}: CartSummaryProps) {
  return (
    <aside className="rounded-xl border p-6">
      <h2 className="text-lg font-semibold">
        Order Summary
      </h2>

      <div className="mt-6 space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">
            Subtotal
          </span>

          <span>${subtotal}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">
            Shipping
          </span>

          <span>Calculated at checkout</span>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${subtotal}</span>
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-xl bg-neutral-950 px-6 py-4 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Proceed to Checkout
      </Link>

      <p className="mt-3 text-center text-xs text-gray-500">
        Checkout will be available in the next
        stage.
      </p>
    </aside>
  );
}