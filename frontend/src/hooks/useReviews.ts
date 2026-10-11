
import { useCallback, useEffect, useState } from "react";

import {
  createReview,
  getReviews,
} from "../api/reviewsApi";

import type {
  CreateReviewInput,
  Review,
} from "../types/review";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getReviews();

      setReviews(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reviews."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadInitialReviews = async () => {
      try {
        const data = await getReviews();

        if (!cancelled) {
          setReviews(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load reviews."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const submitReview = async (
    input: CreateReviewInput
  ): Promise<Review | null> => {
    try {
      setIsSubmitting(true);
      setError(null);
      return await createReview(input);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Unable to reach the server. Check your connection and retry."
          : err instanceof Error
          ? err.message
          : "We couldn't submit your review right now. Please try again later."
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    reviews,
    isLoading,
    isSubmitting,
    error,
    setError,
    clearError,
    submitReview,
    reloadReviews: loadReviews,
  };
}
