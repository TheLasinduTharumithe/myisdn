import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { ProductReview, ProductReviewInput } from "@/types";

const COLLECTION = "reviews";

function getReviewsCollection() {
  return collection(getFirebaseDb(), COLLECTION);
}

function buildReviewId(productId: string, customerId: string) {
  return `${productId}_${customerId}`;
}

function normalizeDate(value: unknown) {
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : value;
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return new Date().toISOString();
}

function normalizeReview(id: string, value: Record<string, unknown>) {
  return {
    id: typeof value.id === "string" && value.id ? value.id : id,
    productId: typeof value.productId === "string" ? value.productId : "",
    customerId: typeof value.customerId === "string" ? value.customerId : "",
    customerName: typeof value.customerName === "string" ? value.customerName : "Customer",
    customerAvatar64: typeof value.customerAvatar64 === "string" ? value.customerAvatar64 : "",
    rating:
      typeof value.rating === "number"
        ? value.rating
        : Math.max(1, Math.min(5, Number(value.rating ?? 0) || 0)),
    comment: typeof value.comment === "string" ? value.comment : "",
    createdAt: normalizeDate(value.createdAt),
    updatedAt: normalizeDate(value.updatedAt),
  } satisfies ProductReview;
}

function validateReviewInput(input: ProductReviewInput) {
  if (!input.productId) {
    throw new Error("Product is required.");
  }

  if (!input.customerId) {
    throw new Error("You must be logged in to submit a review.");
  }

  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  const comment = input.comment?.trim() ?? "";
  if (comment && comment.length < 5) {
    throw new Error("Comment must be at least 5 characters when provided.");
  }
}

function isPermissionDeniedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "permission-denied"
  );
}

function toReviewError(error: unknown, fallbackMessage: string) {
  if (isPermissionDeniedError(error)) {
    return new Error(
      "Firestore review permissions are blocked. Update and deploy the Firestore rules for the reviews collection.",
    );
  }

  return error instanceof Error ? error : new Error(fallbackMessage);
}

export async function getReviewsByProduct(productId: string) {
  if (!productId) {
    return [] as ProductReview[];
  }

  try {
    const snapshot = await getDocs(query(getReviewsCollection(), where("productId", "==", productId)));
    return snapshot.docs
      .map((documentSnapshot) =>
        normalizeReview(documentSnapshot.id, documentSnapshot.data() as Record<string, unknown>),
      )
      .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt));
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return [] as ProductReview[];
    }

    throw toReviewError(error, "Unable to load product reviews.");
  }
}

export async function getReviewByCustomerAndProduct(customerId: string, productId: string) {
  if (!customerId || !productId) {
    return null;
  }

  try {
    const snapshot = await getDoc(doc(getFirebaseDb(), COLLECTION, buildReviewId(productId, customerId)));
    return snapshot.exists()
      ? normalizeReview(snapshot.id, snapshot.data() as Record<string, unknown>)
      : null;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return null;
    }

    throw toReviewError(error, "Unable to load your review.");
  }
}

export async function customerCanReviewProduct(customerId: string, productId: string) {
  return Boolean(customerId && productId);
}

export async function getAverageRatingForProduct(productId: string) {
  const reviews = await getReviewsByProduct(productId);
  if (reviews.length === 0) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const averageRating =
    Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;

  return {
    averageRating,
    reviewCount: reviews.length,
  };
}

export async function getReviewSummaryMap(productIds: string[]) {
  if (productIds.length === 0) {
    return {} as Record<string, { averageRating: number; reviewCount: number }>;
  }

  try {
    const snapshot = await getDocs(getReviewsCollection());
    const summaries = snapshot.docs.reduce<Record<string, { totalRating: number; reviewCount: number }>>(
      (accumulator, documentSnapshot) => {
        const review = normalizeReview(documentSnapshot.id, documentSnapshot.data() as Record<string, unknown>);

        if (!productIds.includes(review.productId)) {
          return accumulator;
        }

        const current = accumulator[review.productId] ?? { totalRating: 0, reviewCount: 0 };
        accumulator[review.productId] = {
          totalRating: current.totalRating + review.rating,
          reviewCount: current.reviewCount + 1,
        };
        return accumulator;
      },
      {},
    );

    return Object.fromEntries(
      productIds.map((productId) => {
        const summary = summaries[productId];
        if (!summary || summary.reviewCount === 0) {
          return [productId, { averageRating: 0, reviewCount: 0 }];
        }

        return [
          productId,
          {
            averageRating: Math.round((summary.totalRating / summary.reviewCount) * 10) / 10,
            reviewCount: summary.reviewCount,
          },
        ];
      }),
    );
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return Object.fromEntries(
        productIds.map((productId) => [productId, { averageRating: 0, reviewCount: 0 }]),
      );
    }

    throw toReviewError(error, "Unable to load product rating summaries.");
  }
}

export async function addOrUpdateReview(input: ProductReviewInput) {
  validateReviewInput(input);

  try {
    const existingReview = await getReviewByCustomerAndProduct(input.customerId, input.productId);

    const now = new Date().toISOString();
    const reviewId = existingReview?.id ?? buildReviewId(input.productId, input.customerId);

    const review: ProductReview = {
      id: reviewId,
      productId: input.productId,
      customerId: input.customerId,
      customerName: input.customerName.trim(),
      customerAvatar64: input.customerAvatar64 ?? "",
      rating: input.rating,
      comment: input.comment?.trim() ?? "",
      createdAt: existingReview?.createdAt ?? now,
      updatedAt: now,
    };

    await setDoc(doc(getFirebaseDb(), COLLECTION, reviewId), review);
    return review;
  } catch (error) {
    throw toReviewError(error, "Unable to save your review.");
  }
}
