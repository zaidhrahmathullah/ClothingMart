import { apiFetch } from "@/lib/api";

import type {
  ReviewResponse,
} from "@/types/review";

export async function getProductReviews(
  productId: string,
) {
  return apiFetch<ReviewResponse>(
    `/products/${productId}/reviews`,
  );
}

export async function createReview(
  productId: string,
  data: {
    rating: number;
    comment: string;
  },
) {
  return apiFetch(
    `/products/${productId}/reviews`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function updateReview(
  productId: string,
  reviewId: string,
  data: {
    rating: number;
    comment: string;
  },
) {
  return apiFetch(
    `/products/${productId}/reviews/${reviewId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteReview(
  productId: string,
  reviewId: string,
) {
  return apiFetch(
    `/products/${productId}/reviews/${reviewId}`,
    {
      method: "DELETE",
    },
  );
}