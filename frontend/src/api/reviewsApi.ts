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
    let payload: { code?: string; message?: string } | null = null;
    try {
      payload = (await response.json()) as { code?: string; message?: string };
    } catch {
      // response is not JSON
    }

    if (response.status === 429) {
      throw new Error("Too many attempts. Please wait before trying again.");
    }

    if (response.status === 403) {
      if (
        payload?.code === "invalid-token" ||
        payload?.message?.toLowerCase().includes("security check")
      ) {
        throw new Error("Please complete the security check and try again.");
      }
      if (
        payload?.message?.includes("verify your name") ||
        payload?.message?.includes("name against a service request")
      ) {
        throw new Error(
          "Sorry, we couldn't verify your name against a service request. Please check the name you used when booking and try again."
        );
      }
      throw new Error(
        payload?.message ??
          "Sorry, we couldn't verify your name against a service request. Please check the name you used when booking and try again."
      );
    }

    if (response.status === 422) {
      throw new Error(
        payload?.message ?? "Check your name, service category, rating, and review text."
      );
    }

    if (response.status === 503) {
      if (
        payload?.code === "unavailable" ||
        payload?.message?.toLowerCase().includes("security")
      ) {
        throw new Error("Please complete the security check and try again.");
      }
      throw new Error("We couldn't submit your review right now. Please try again later.");
    }

    if (response.status >= 500) {
      throw new Error("We couldn't submit your review right now. Please try again later.");
    }

    throw new Error(payload?.message ?? "We couldn't submit your review right now. Please try again later.");
  }

  return response.json();
}