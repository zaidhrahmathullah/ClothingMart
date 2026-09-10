"use client";

import { useState } from "react";

import {
  createReview,
} from "@/services/review";

type ReviewFormProps = {
  productId: string;
  onCreated?: () => void;
};

export default function ReviewForm({
  productId,
  onCreated,
}: ReviewFormProps) {
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
      className="mt-8 rounded-2xl bg-neutral-50 p-6"
    >
      <h3 className="font-semibold">
        Write a Review
      </h3>

      <div className="mt-4">
        <p className="text-sm font-medium">
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
                  className={`text-2xl ${
                    value <= rating
                      ? "text-neutral-950"
                      : "text-neutral-300"
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
        rows={5}
        className="mt-4 w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm outline-none focus:border-neutral-950"
      />

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Submitting..."
          : "Submit Review"}
      </button>
    </form>
  );
}