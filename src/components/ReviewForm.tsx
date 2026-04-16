"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import ProductRating from "@/components/ProductRating";
import { Product, ProductReview } from "@/types";

interface ReviewFormProps {
  product: Product;
  existingReview?: ProductReview | null;
  canReview: boolean;
  loading?: boolean;
  eligibilityMessage?: string;
  onSubmit: (values: { rating: number; comment: string }) => Promise<void> | void;
}

export default function ReviewForm({
  product,
  existingReview,
  canReview,
  loading = false,
  eligibilityMessage,
  onSubmit,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
    setError("");
  }, [existingReview, product.id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (rating < 1 || rating > 5) {
      setError("Please select a rating between 1 and 5 stars.");
      return;
    }

    const trimmedComment = comment.trim();
    if (trimmedComment && trimmedComment.length < 5) {
      setError("Comment must be at least 5 characters when provided.");
      return;
    }

    await onSubmit({ rating, comment: trimmedComment });
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-orange-100 p-3 text-[#f57224]">
          <MessageSquareText size={18} />
        </div>
        <div>
          <p className="page-eyebrow">{existingReview ? "Update Review" : "Write Review"}</p>
          <h3 className="mt-2 text-xl font-bold text-slate-900">Rate {product.name}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            Share your product experience with a star rating and an optional feedback comment.
          </p>
        </div>
      </div>

      {!canReview ? (
        <div className="notice-info mt-5">
          {eligibilityMessage ?? "You can submit a rating and feedback for this product."}
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        <div>
          <p className="field-label">Star Rating</p>
          <ProductRating value={rating} onChange={setRating} interactive showValue={false} size={22} />
          <p className="mt-2 text-sm text-slate-500">
            {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""} selected` : "Choose between 1 and 5 stars"}
          </p>
        </div>

        <label className="block">
          <span className="field-label">Feedback Comment</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            className="textarea-field"
            placeholder="Share what you liked, product quality notes, or delivery-related feedback."
          />
        </label>
      </div>

      {error ? <p className="notice-error mt-5">{error}</p> : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading || !canReview}
          className="btn-primary w-full justify-center disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Saving Review..." : existingReview ? "Update Review" : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRating(existingReview?.rating ?? 0);
            setComment(existingReview?.comment ?? "");
            setError("");
          }}
          className="btn-outline w-full justify-center sm:w-auto"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
