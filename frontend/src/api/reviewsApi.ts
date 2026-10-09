
import type {
  CreateReviewInput,
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
): Promise<Review> {
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
    throw new Error("Failed to submit review.");
  }

  return response.json();
}