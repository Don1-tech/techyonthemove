
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import ReviewCard from "../../components/cards/ReviewCard";
import TurnstileWidget from "../../components/security/TurnstileWidget";
import { useReviews } from "../../hooks/useReviews";

import type { CreateReviewInput } from "../../types/review";

import styles from "./reviews.module.css";

const serviceCategories = [
  "Network Installation & Setup",
  "Home & Smart Network Setup",
  "PC Building & Hardware Upgrades",
  "Computer Troubleshooting & Repair",
  "Network Troubleshooting & Optimization",
];

const REVIEWS_PER_LOAD = 2;

export default function ReviewsList() {
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const reviewDialogRef = useRef<HTMLElement | null>(null);

  const {
    reviews,
    isLoading,
    isSubmitting,
    error,
    setError,
    clearError,
    submitReview,
    reloadReviews,
  } = useReviews();

  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileWidgetKey, setTurnstileWidgetKey] = useState(0);
  const submitLockRef = useRef(false);
  const submissionKeyRef = useRef<{
    fingerprint: string;
    key: string;
  } | null>(null);

  const [visibleCount, setVisibleCount] =
    useState(REVIEWS_PER_LOAD);

  const [showSuccessToast, setShowSuccessToast] =
    useState(false);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const dialog = reviewDialogRef.current;
    const trigger = reviewTriggerRef.current;

    if (!dialog) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow =
      document.documentElement.style.overflow;
    const focusableSelector = [
      "button:not([disabled])",
      "a[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ");

    const getFocusableElements = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter(
        (element) =>
          element.getAttribute("aria-hidden") !== "true" &&
          element.getClientRects().length > 0
      );

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    dialog.querySelector<HTMLInputElement>("input")?.focus({
      preventScroll: true,
    });

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement =
        focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (
        event.shiftKey &&
        (activeElement === firstElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        (activeElement === lastElement ||
          !dialog.contains(activeElement))
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (
        event.target instanceof Node &&
        !dialog.contains(event.target)
      ) {
        dialog.querySelector<HTMLInputElement>("input")?.focus({
          preventScroll: true,
        });
      }
    };

    document.addEventListener("keydown", handleTab);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleTab);
      document.removeEventListener("focusin", handleFocusIn);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow =
        previousRootOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [showForm]);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setShowForm(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showForm, isSubmitting]);

  /*
   * Hide the success toast automatically.
   */
  useEffect(() => {
    if (!showSuccessToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSuccessToast(false);
    }, 7000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showSuccessToast]);

  const openReviewForm = () => {
    setShowForm(true);
  };

  const closeReviewForm = () => {
    if (isSubmitting) {
      return;
    }

    setTurnstileToken("");
    clearError();
    setShowForm(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    clearError();

    if (submitLockRef.current || isSubmitting) {
      return;
    }

    const trimmedName = customerName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (!serviceCategory) {
      setError("Please select the service you received.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    const trimmedText = reviewText.trim();
    if (!trimmedText || trimmedText.length < 5) {
      setError("Please provide a little more detail about your experience.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the security check and try again.");
      return;
    }

    const content: Omit<CreateReviewInput, "turnstileToken" | "idempotencyKey"> = {
      customerName: trimmedName,
      serviceCategory,
      rating,
      reviewText: trimmedText,
    };
    const fingerprint = JSON.stringify(content);
    if (submissionKeyRef.current?.fingerprint !== fingerprint) {
      submissionKeyRef.current = {
        fingerprint,
        key: crypto.randomUUID(),
      };
    }
    submitLockRef.current = true;
    try {
      const review = await submitReview({
        ...content,
        turnstileToken,
        idempotencyKey: submissionKeyRef.current.key,
      });

      if (!review) {
        return;
      }

      setCustomerName("");
      setServiceCategory("");
      setRating(0);
      setReviewText("");
      submissionKeyRef.current = null;
      setShowForm(false);
      setShowSuccessToast(true);
      await reloadReviews();
    } finally {
      submitLockRef.current = false;
      setTurnstileToken("");
      setTurnstileWidgetKey((key) => key + 1);
    }
  };

  const displayedCount = Math.min(
    Math.max(
      visibleCount,
      Math.min(REVIEWS_PER_LOAD, reviews.length)
    ),
    reviews.length
  );

  const visibleReviews = reviews.slice(0, displayedCount);

  const hasMoreReviews =
    displayedCount < reviews.length;

  const handleShowMore = () => {
    setVisibleCount(() =>
      Math.min(
        displayedCount + REVIEWS_PER_LOAD,
        reviews.length
      )
    );
  };

  const handleShowLess = () => {
    setVisibleCount(REVIEWS_PER_LOAD);

    document
      .getElementById("reviews")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <>
      <div className={styles.reviewsContent}>
        <div className={styles.reviewToolbar}>
          <button
            type="button"
            ref={reviewTriggerRef}
            className={styles.addReviewButton}
            onClick={openReviewForm}
          >
            <span aria-hidden="true">+</span>
            Add Review
          </button>
        </div>

        {isLoading && (
          <div
            className={styles.reviewsGrid}
            role="status"
            aria-label="Loading reviews"
          >
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className={styles.reviewSkeleton}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>
            ))}
          </div>
        )}

        {!isLoading && error && !showForm && (
          <div className={styles.reviewLoadError} role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void reloadReviews()}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && reviews.length === 0 && (
          <div className={styles.reviewEmptyState}>
            <span aria-hidden="true">✦</span>
            <p>No reviews yet. Be the first to share your experience.</p>
          </div>
        )}

        {!isLoading && !error && reviews.length > 0 && (
          <div className={styles.reviewsGrid}>
            {visibleReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {!isLoading && !error && reviews.length > REVIEWS_PER_LOAD && (
          <div className={styles.reviewPagination}>
            <button
              type="button"
              className={styles.showMoreButton}
              onClick={hasMoreReviews ? handleShowMore : handleShowLess}
            >
              <span aria-hidden="true">{hasMoreReviews ? "+" : "−"}</span>
              {hasMoreReviews ? "Show More" : "View Less"}
            </button>
          </div>
        )}
      </div>

      {showForm &&
        createPortal(
          <div
            className={styles.reviewModalOverlay}
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeReviewForm();
              }
            }}
          >
            <section
              ref={reviewDialogRef}
              className={styles.reviewModal}
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-modal-title"
            >
              <div className={styles.reviewModalHeader}>
                <div>
                  <h3 id="review-modal-title">
                    ADD YOUR REVIEW
                  </h3>

                  <p>
                    Share your experience with Techy On The Move.
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.closeReviewForm}
                  onClick={closeReviewForm}
                  disabled={isSubmitting}
                  aria-label="Close review form"
                >
                  ×
                </button>
              </div>

              <form
                className={styles.reviewForm}
                onSubmit={handleSubmit}
                onChange={clearError}
              >
                <p className={styles.reviewEligibilityTip}>
                  <span aria-hidden="true">ⓘ</span>
                  Use the same name you used when making your service request.
                </p>

                <label className={styles.reviewField}>
                  <span>Your Name</span>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    minLength={2}
                    maxLength={120}
                    required
                    placeholder="Enter your name"
                  />
                </label>

                <label className={styles.reviewField}>
                  <span>Service Category</span>
                  <select
                    value={serviceCategory}
                    onChange={(event) => setServiceCategory(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select the service you received
                    </option>
                    {serviceCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className={styles.ratingField}>
                  <legend>Your Rating</legend>
                  <div className={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={
                          star <= rating
                            ? styles.ratingStarActive
                            : styles.ratingStar
                        }
                        onClick={() => {
                          setRating(star);
                          clearError();
                        }}
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        aria-pressed={star === rating}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className={styles.reviewField}>
                  <span>Your Review</span>
                  <textarea
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    minLength={5}
                    maxLength={1000}
                    required
                    placeholder="Tell us about your experience..."
                    rows={5}
                  />
                </label>

                <TurnstileWidget
                  key={turnstileWidgetKey}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ""}
                  action="review_submit"
                  onTokenChange={(token) => {
                    setTurnstileToken(token);
                    if (token) {
                      clearError();
                    }
                  }}
                />

                {error && showForm && (
                  <div className={styles.reviewError} role="alert">
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={clearError}
                      aria-label="Dismiss error"
                    >
                      ×
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className={styles.submitReviewButton}
                  disabled={
                    isSubmitting ||
                    customerName.trim().length < 2 ||
                    !serviceCategory ||
                    rating === 0 ||
                    reviewText.trim().length < 5 ||
                    !turnstileToken
                  }
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className={styles.submitSpinner}
                        aria-hidden="true"
                      />
                      Submitting review...
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </form>
            </section>
          </div>,
          document.body
        )}

      {showSuccessToast && (
        <div
          className={styles.successToast}
          role="status"
          aria-live="polite"
        >
          <div
            className={styles.successToastIcon}
            aria-hidden="true"
          >
            ✓
          </div>

          <div className={styles.successToastContent}>
            <h4 className={styles.successToastTitle}>
              Review submitted. Thank you!
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            aria-label="Dismiss success message"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}