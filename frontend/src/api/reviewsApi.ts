
import type {
  CreateReviewInput,
  ReviewChallenge,
  Review,
} from "../types/review";

import { API_BASE_URL } from "./config";

export async function getReviews(): Promise<Review[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews`
  );

  if (!response.ok) {
    throw new Error("Failed to load reviews.");
  }

  return response.json();
}

export async function createReview(
  input: CreateReviewInput
): Promise<ReviewChallenge> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message ?? "Failed to submit review.");
  }

  return response.json();
}

export async function verifyReview(
  verificationId: string,
  code: string
): Promise<Review> {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/verification/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ verificationId, code }),
    }
  );

  if (!response.ok) {
    const error = (await response.json()) as { message?: string };
    throw new Error(error.message ?? "Failed to verify review.");
  }

  return response.json();
}