import type { Review } from "@/types/review";

type ReviewSectionProps = {
  reviews: Review[];
  averageRating: number;
  reviewCount: number;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div
      className="flex"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={
            index < rating ? "text-neutral-950" : "text-neutral-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewSection({
  reviews,
  averageRating,
  reviewCount,
}: ReviewSectionProps) {
  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Reviews</h2>

          <div className="mt-3 flex items-center gap-3">
            <Stars rating={Math.round(averageRating)} />

            <span className="text-sm text-neutral-600">
              {averageRating.toFixed(1)} · {reviewCount} reviews
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {reviews.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No reviews yet.
          </p>
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="border-b border-neutral-100 pb-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{review.user.name}</p>

                  <Stars rating={review.rating} />
                </div>

                <time className="text-xs text-neutral-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </div>

              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {review.comment}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
