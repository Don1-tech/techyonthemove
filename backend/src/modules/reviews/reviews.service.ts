import {
  createReview,
  deleteReview,
  getAllReviews,
} from "./reviews.repository";

import type { CreateReviewInput, Review } from "./reviews.types";

export async function submitReview(
  input: CreateReviewInput
): Promise<Review> {
  return createReview(input);
}

export async function listReviews(): Promise<Review[]> {
  return getAllReviews();
}

export async function deleteReviewById(
  id: string
): Promise<Review | null> {
  return deleteReview(id);
}