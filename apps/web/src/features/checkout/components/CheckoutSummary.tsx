import type { Cart } from "@/types/cart";

type CheckoutSummaryProps = {
  cart: Cart;
  isSubmitting: boolean;
  disabled: boolean;
  onPlaceOrder: () => void;
};

export default function CheckoutSummary({
  cart,
  isSubmitting,
  disabled,
  onPlaceOrder,
}: CheckoutSummaryProps) {
  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-lg font-bold text-neutral-950">
        Order Summary
      </h2>

      <div className="mt-6 space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4"
          >
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
              {item.product.imageUrl && (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {item.product.name}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                {item.variant.color} /{" "}
                {item.variant.size}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Qty: {item.quantity}
              </p>
            </div>

            <p className="text-sm font-semibold">
              LKR {item.subtotal}
            </p>
          </div>
        ))}
      </div>

      <div className="my-6 border-t border-neutral-200" />

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">
            Subtotal
          </span>

          <span>
            LKR {cart.subtotal}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-neutral-500">
            Shipping
          </span>

          <span>
            Free
          </span>
        </div>
      </div>

      <div className="my-6 border-t border-neutral-200" />

      <div className="flex justify-between">
        <span className="font-semibold">
          Total
        </span>

        <span className="text-xl font-bold">
          LKR {cart.subtotal}
        </span>
      </div>

      <button
        type="button"
        disabled={disabled || isSubmitting}
        onClick={onPlaceOrder}
        className="mt-6 w-full rounded-xl bg-neutral-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isSubmitting
          ? "Placing Order..."
          : "Place Order"}
      </button>

      <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
        Payment will be available after
        order confirmation.
      </p>
    </aside>
  );
}
