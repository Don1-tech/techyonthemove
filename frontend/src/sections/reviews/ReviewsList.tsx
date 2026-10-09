
import { useEffect, useState } from "react";

import ReviewCard from "../../components/cards/ReviewCard";
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

const REVIEWS_PER_LOAD = 3;

export default function ReviewsList() {
  const {
    reviews,
    isLoading,
    isSubmitting,
    error,
    submitReview,
    reloadReviews,
  } = useReviews();

  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const [visibleCount, setVisibleCount] =
    useState(REVIEWS_PER_LOAD);

  const [showSuccessToast, setShowSuccessToast] =
    useState(false);

  /*
   * Hide the success toast automatically.
   */
  useEffect(() => {
    if (!showSuccessToast) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowSuccessToast(false);
    }, 9000);

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

    setShowForm(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const input: CreateReviewInput = {
      customerName: customerName.trim(),
      serviceCategory,
      rating,
      reviewText: reviewText.trim(),
    };

    const review = await submitReview(input);

    if (!review) {
      return;
    }

    /*
     * Clear form fields.
     */
    setCustomerName("");
    setServiceCategory("");
    setRating(0);
    setReviewText("");

    /*
     * Close the form.
     */
    setShowForm(false);

    /*
     * Show success toast.
     */
    setShowSuccessToast(true);

    /*
     * Reload reviews from the backend.
     * The backend remains the source of truth.
     */
    await reloadReviews();
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

  const canViewLess =
    reviews.length > REVIEWS_PER_LOAD &&
    displayedCount > REVIEWS_PER_LOAD;

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
        <div className={styles.reviewsList}>
          {isLoading && (
            <p className={styles.reviewStatus}>
              Loading reviews...
            </p>
          )}

          {!isLoading && error && (
            <p className={styles.reviewError}>
              {error}
            </p>
          )}

          {!isLoading &&
            !error &&
            reviews.length === 0 && (
              <p className={styles.reviewStatus}>
                No reviews available yet.
              </p>
            )}

          {!isLoading &&
            visibleReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
              />
            ))}
        </div>

        {!isLoading && reviews.length > 0 && (
          <div className={styles.reviewActions}>
            <button
              type="button"
              className={styles.addReviewButton}
              onClick={openReviewForm}
            >
              <span aria-hidden="true">+</span>
              Add Review
            </button>

            {reviews.length > REVIEWS_PER_LOAD && (
              <button
                type="button"
                className={styles.showMoreButton}
                onClick={
                  hasMoreReviews
                    ? handleShowMore
                    : handleShowLess
                }
              >
                <span aria-hidden="true">
                  {hasMoreReviews ? "+" : "−"}
                </span>

                {hasMoreReviews
                  ? "Show More"
                  : canViewLess
                    ? "View Less"
                    : "Show More"}
              </button>
            )}
          </div>
        )}

        {!isLoading &&
          reviews.length === 0 && (
            <div className={styles.reviewActions}>
              <button
                type="button"
                className={styles.addReviewButton}
                onClick={openReviewForm}
              >
                <span aria-hidden="true">+</span>
                Add Review
              </button>
            </div>
          )}
      </div>

      {showForm && (
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
            >
              <label className={styles.reviewField}>
                <span>Your Name</span>

                <input
                  type="text"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
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
                  onChange={(event) =>
                    setServiceCategory(event.target.value)
                  }
                  required
                >
                  <option value="" disabled>
                    Select the service you received
                  </option>

                  {serviceCategories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
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
                      onClick={() => setRating(star)}
                      aria-label={`${star} star${
                        star === 1 ? "" : "s"
                      }`}
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
                  onChange={(event) =>
                    setReviewText(event.target.value)
                  }
                  minLength={5}
                  maxLength={1000}
                  required
                  placeholder="Tell us about your experience..."
                  rows={5}
                />
              </label>

              {error && (
                <p className={styles.reviewError}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={styles.submitReviewButton}
                disabled={
                  isSubmitting ||
                  rating === 0 ||
                  !serviceCategory
                }
              >
                {isSubmitting
                  ? "Submitting Review..."
                  : "Submit Review"}
              </button>
            </form>
          </section>
        </div>
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
              Review submitted. Thankyou!
            </h4>

          </div>
        </div>
      )}
    </>
  );
}