"use client";

import { useState } from "react";

import {
  createReview,
} from "@/services/review";

import { usePathname, useRouter } from "next/navigation";

import {
  getLoginHref,
  isAuthenticationError,
} from "@/lib/auth-navigation";

type ReviewFormProps = {
  productId: string;
  onCreated?: () => void;
};

export default function ReviewForm({
  productId,
  onCreated,
}: ReviewFormProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [rating, setRating] =
    useState(5);

  const [comment, setComment] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    if (comment.trim().length < 5) {
      setError(
        "Please write at least 5 characters.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createReview(
        productId,
        {
          rating,
          comment: comment.trim(),
        },
      );

      setComment("");
      onCreated?.();
    } catch (error) {
      if (isAuthenticationError(error)) {
        router.push(getLoginHref(pathname));
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit review",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-12 border-t border-neutral-200 pt-8"
    >
      <div className="max-w-xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Your Experience
        </p>

        <h3 className="mt-2 text-xl font-medium tracking-[-0.02em] text-neutral-950">
          Write a Review
        </h3>

        <div className="mt-5">
          <p className="text-[13px] font-semibold text-neutral-950">
            Rating
          </p>

          <div className="mt-2 flex gap-1">
            {Array.from(
              { length: 5 },
              (_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(value)
                    }
                    className={`text-xl leading-none transition-colors ${
                      value <= rating
                        ? "text-neutral-950"
                        : "text-neutral-300 hover:text-neutral-500"
                    }`}
                    aria-label={`Rate ${value} stars`}
                  >
                    ★
                  </button>
                );
              },
            )}
          </div>
        </div>

        <textarea
          value={comment}
          onChange={(event) =>
            setComment(event.target.value)
          }
          placeholder="Share your experience..."
          rows={4}
          className="mt-4 w-full resize-y rounded-md border border-neutral-300 bg-white p-3 text-[13px] leading-5 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
        />

        {error && (
          <p className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-3 rounded bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Submitting..."
            : "Submit Review"}
        </button>
      </div>
    </form>
  );
}