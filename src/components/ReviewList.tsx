"use client";

import ProductRating from "@/components/ProductRating";
import { formatDate } from "@/lib/utils";
import { ProductReview } from "@/types";

interface ReviewListProps {
  reviews: ProductReview[];
  averageRating: number;
  reviewCount: number;
  loading?: boolean;
}

export default function ReviewList({
  reviews,
  averageRating,
  reviewCount,
  loading = false,
}: ReviewListProps) {
  return (
    <section className="surface-card rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="page-eyebrow">Customer Feedback</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Product review summary</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Recent customer ratings and comments shared for this product.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <ProductRating value={averageRating} reviewCount={reviewCount} />
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-4 py-8 text-center text-sm text-slate-600">
          No reviews yet. Be the first customer to rate this product.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  {review.customerAvatar64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={review.customerAvatar64}
                      alt={review.customerName}
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-orange-100"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#f57224]">
                      {review.customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{review.customerName}</p>
                    <p className="text-xs text-slate-500">{formatDate(review.updatedAt || review.createdAt)}</p>
                  </div>
                </div>
                <ProductRating value={review.rating} showValue={false} />
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {review.comment?.trim() ? review.comment : "Rated this product without leaving a written comment."}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
