"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";

import {
  getLoginHref,
  isAuthenticationError,
} from "@/lib/auth-navigation";

import {
  addToWishlist,
  removeFromWishlist,
} from "@/services/wishlist";

import {
  useNotification,
} from "@/components/feedback/NotificationProvider";


type Props = {
  productId: string;
  initialWishlisted?: boolean;
};

export default function WishlistButton({
  productId,
  initialWishlisted = false,
}: Props) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const notification = useNotification();

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    setLoading(true);

    try {
      if (wishlisted) {
        await removeFromWishlist(productId);
        setWishlisted(false);
        notification.info(
          "Removed from your wishlist.",
        );
      } else {
        await addToWishlist(productId);
        setWishlisted(true);
        notification.success(
          "Saved to your wishlist.",
        );
      }

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";

      if (isAuthenticationError(error)) {
        router.push(
          getLoginHref(window.location.pathname),
        );
        return;
      }

      notification.error(
        message ||
          "Unable to update your wishlist.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-pressed={wishlisted}
        aria-label={
          loading
            ? "Updating wishlist"
            : wishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
        }
        title={
          wishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        aria-busy={loading}
        className="flex h-8 w-8 items-center justify-center rounded bg-white/95 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Heart
          className={`h-4 w-4 ${
            wishlisted
              ? "fill-current text-neutral-950"
              : "text-neutral-700"
          }`}
          aria-hidden="true"
        />
      </button>

    </>
  );
}
