"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  PayPalButtons,
  PayPalScriptProvider,
} from "@paypal/react-paypal-js";

import {
  cancelPayPalPayment,
  capturePayPalPayment,
  createPayPalPayment,
} from "@/services/payment";

import {
  useCart,
} from "@/features/cart/context/CartContext";

import {
  getPublicPayPalConfig,
  type PublicPayPalConfig,
} from "@/services/payment-config";

type PayPalCheckoutProps = {
  disabled?: boolean;
  onCreateClothingMartOrder:
    () => Promise<string>;
  onPaymentSuccess:
    (orderId: string) => void;
  onPaymentError:
    (message: string) => void;
};

export default function PayPalCheckout({
  disabled = false,
  onCreateClothingMartOrder,
  onPaymentSuccess,
  onPaymentError,
}: PayPalCheckoutProps) {
  const [
    paypalConfig,
    setPayPalConfig,
  ] =
    useState<PublicPayPalConfig | null>(
      null,
    );

  const [
    configError,
    setConfigError,
  ] =
    useState<string | null>(null);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadConfiguration() {
      try {
        const config =
          await getPublicPayPalConfig(
            controller.signal,
          );

        if (!controller.signal.aborted) {
          setPayPalConfig(config);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "PayPal configuration error:",
            error,
          );

          setConfigError(
            "PayPal is temporarily unavailable. Please try again later.",
          );
        }
      }
    }

    void loadConfiguration();

    return () => {
      controller.abort();
    };
  }, []);

  const {
    refreshCart,
  } = useCart();

  /*
   * Keep track of the ClothingMart order that belongs
   * to the PayPal order created during this checkout.
   */
  const clothingMartOrderIdRef =
    useRef<string | null>(null);

  if (configError) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="rounded border border-red-200 bg-red-50 px-4 py-3"
      >
        <p className="text-[12px] font-semibold text-red-800">
          Payment unavailable
        </p>

        <p className="mt-1 text-[11px] leading-5 text-red-700">
          {configError}
        </p>
      </div>
    );
  }

  if (!paypalConfig) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3"
      >
        <p className="text-[12px] font-medium text-neutral-700">
          Preparing secure payment...
        </p>

        <p className="mt-1 text-[11px] leading-4 text-neutral-500">
          PayPal checkout will be available
          in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Payment Method
            </p>

            <p className="mt-1 text-[13px] font-semibold text-neutral-950">
              PayPal
            </p>

            <p className="mt-1 text-[11px] leading-5 text-neutral-500">
              Complete your payment securely
              through PayPal.
            </p>
          </div>

          <div className="shrink-0 rounded border border-neutral-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#003087]">
            PayPal
          </div>
        </div>
      </div>

      <div className="rounded border border-neutral-200 bg-white p-3">
        <PayPalScriptProvider
          options={{
            clientId:
              paypalConfig.clientId,
            currency:
              paypalConfig.currency,
            intent:
              paypalConfig.intent,
          }}
        >
          <PayPalButtons
            disabled={disabled}
            style={{
              layout: "vertical",
              shape: "rect",
              label: "paypal",
              height: 40,
            }}
            createOrder={async () => {
              try {
                const orderId =
                  await onCreateClothingMartOrder();

                clothingMartOrderIdRef.current =
                  orderId;

                const payment =
                  await createPayPalPayment(
                    orderId,
                  );

                if (
                  typeof payment.providerOrderId !==
                    "string" ||
                  !payment.providerOrderId
                ) {
                  throw new Error(
                    "PayPal did not return a valid Order ID.",
                  );
                }

                return payment.providerOrderId;
              } catch (error) {
                console.error(
                  "PayPal order creation error:",
                  error,
                );

                onPaymentError(
                  "We could not start PayPal checkout. No payment has been confirmed.",
                );

                throw error;
              }
            }}
            onApprove={async (data) => {
              try {
                const orderId =
                  clothingMartOrderIdRef.current;

                if (!orderId) {
                  throw new Error(
                    "ClothingMart Order ID is missing.",
                  );
                }

                const payment =
                  await capturePayPalPayment(
                    orderId,
                    data.orderID,
                  );

                if (
                  payment.status !==
                  "COMPLETED"
                ) {
                  throw new Error(
                    "PayPal payment was not completed.",
                  );
                }

                /*
                 * The backend has now finalized the purchased
                 * quantities against the current cart.
                 *
                 * Refetch that authoritative cart rather than
                 * assuming successful checkout made it empty.
                 */
                await refreshCart();

                onPaymentSuccess(orderId);
              } catch (error) {
                console.error(
                  "PayPal capture error:",
                  error,
                );

                onPaymentError(
                  "We could not confirm the final payment status. If you approved the payment in PayPal, please do not retry immediately.",
                );
              }
            }}
            onCancel={async (data) => {
              const orderId =
                clothingMartOrderIdRef.current;

              if (!orderId) {
                onPaymentError(
                  "PayPal checkout was cancelled.",
                );

                return;
              }

              const providerOrderId =
                typeof data.orderID ===
                "string"
                  ? data.orderID
                  : null;

              if (!providerOrderId) {
                onPaymentError(
                  "PayPal checkout was cancelled, but the PayPal Order ID was unavailable.",
                );

                return;
              }

              try {
                await cancelPayPalPayment(
                  orderId,
                  providerOrderId,
                );

                onPaymentError(
                  "PayPal checkout was cancelled. No payment was completed.",
                );
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "Unable to confirm PayPal cancellation.";

                onPaymentError(message);
              }
            }}
            onError={(error) => {
              console.error(
                "PayPal checkout error:",
                error,
              );

              onPaymentError(
                "PayPal encountered an error. If you approved a payment, please do not retry immediately while its status is being confirmed.",
              );
            }}
          />
        </PayPalScriptProvider>
      </div>

      <p className="text-[10px] leading-4 text-neutral-400">
        Do not close or refresh this page
        while PayPal is processing your
        payment.
      </p>
    </div>
  );
}