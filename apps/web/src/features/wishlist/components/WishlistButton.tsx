"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addToWishlist,
  removeFromWishlist,
} from "@/services/wishlist";

type Props = {
  productId: string;
  initialWishlisted?: boolean;
};

export default function WishlistButton({
  productId,
  initialWishlisted = false,
}: Props) {
  const router = useRouter();

  const [wishlisted, setWishlisted] =
    useState(initialWishlisted);

  const [loading, setLoading] =
    useState(false);

  async function handleClick() {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      if (wishlisted) {
        await removeFromWishlist(productId);
        setWishlisted(false);
      } else {
        await addToWishlist(productId);
        setWishlisted(true);
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "";

      if (
        message
          .toLowerCase()
          .includes("authentication")
      ) {
        router.push(
          `/login?next=${encodeURIComponent(
            window.location.pathname,
          )}`,
        );

        return;
      }

      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={
        wishlisted
          ? "Remove from wishlist"
          : "Add to wishlist"
      }
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60"
    >
      <Heart
        className={`h-5 w-5 ${
          wishlisted
            ? "fill-current text-neutral-950"
            : "text-neutral-700"
        }`}
      />
    </button>
  );
}