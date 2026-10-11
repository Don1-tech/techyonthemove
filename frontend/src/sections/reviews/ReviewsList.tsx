
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const REVIEWS_PER_LOAD = 2;

export default function ReviewsList() {
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const reviewDialogRef = useRef<HTMLElement | null>(null);

  const {
    reviews,
    isLoading,
    isSubmitting,
    error,
    submitReview,
    confirmReview,
    reloadReviews,
  } = useReviews();

  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewVerificationId, setReviewVerificationId] = useState("");
  const [reviewVerificationExpiresAt, setReviewVerificationExpiresAt] =
    useState("");
  const [reviewVerificationCode, setReviewVerificationCode] = useState("");
  const [reviewVerificationNow, setReviewVerificationNow] = useState(0);

  const [visibleCount, setVisibleCount] =
    useState(REVIEWS_PER_LOAD);

  const [showSuccessToast, setShowSuccessToast] =
    useState(false);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    const dialog = reviewDialogRef.current;

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
      reviewTriggerRef.current?.focus({ preventScroll: true });
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
    }, 9000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [showSuccessToast]);

  useEffect(() => {
    if (!reviewVerificationId) {
      return;
    }
    const interval = window.setInterval(
      () => setReviewVerificationNow(Date.now()),
      1000
    );
    return () => window.clearInterval(interval);
  }, [reviewVerificationId]);

  const openReviewForm = () => {
    setShowForm(true);
  };

  const closeReviewForm = () => {
    if (isSubmitting) {
      return;
    }

    setReviewVerificationId("");
    setReviewVerificationExpiresAt("");
    setReviewVerificationCode("");
    setShowForm(false);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const input: CreateReviewInput = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      serviceCategory,
      rating,
      reviewText: reviewText.trim(),
    };

    const challenge = await submitReview(input);

    if (!challenge) {
      return;
    }

    setReviewVerificationId(challenge.verificationId);
    setReviewVerificationExpiresAt(challenge.expiresAt);
    setReviewVerificationCode("");
    setReviewVerificationNow(Date.now());
  };

  const handleVerifyReview = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!reviewVerificationId) {
      return;
    }

    const review = await confirmReview(
      reviewVerificationId,
      reviewVerificationCode
    );
    if (!review) {
      return;
    }

    /*
     * Clear form fields.
     */
    setCustomerName("");
    setPhone("");
    setServiceCategory("");
    setRating(0);
    setReviewText("");
    setReviewVerificationId("");
    setReviewVerificationExpiresAt("");
    setReviewVerificationCode("");

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
              ref={reviewTriggerRef}
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
                ref={reviewTriggerRef}
                className={styles.addReviewButton}
                onClick={openReviewForm}
              >
                <span aria-hidden="true">+</span>
                Add Review
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
                onSubmit={reviewVerificationId ? handleVerifyReview : handleSubmit}
              >
                {reviewVerificationId ? (
                  <>
                    <p>
                      If the details match a service request, a six-digit code
                      was sent by SMS. Enter it below to submit your review.
                    </p>
                    <label className={styles.reviewField}>
                      <span>Verification code</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={reviewVerificationCode}
                        onChange={(event) =>
                          setReviewVerificationCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        maxLength={6}
                        pattern="[0-9]{6}"
                        required
                        aria-label="Six-digit verification code"
                      />
                    </label>
                    <p role="timer">
                      Code expires in{" "}
                      {Math.max(
                        0,
                        Math.ceil(
                          (Date.parse(reviewVerificationExpiresAt) -
                            reviewVerificationNow) /
                            1000
                        )
                      )}{" "}
                      seconds.
                    </p>
                    <p>
                      If the SMS does not arrive, close this form and try again
                      after a short wait.
                    </p>
                    <button
                      type="button"
                      className={styles.closeReviewForm}
                      onClick={() => {
                        setReviewVerificationId("");
                        setReviewVerificationExpiresAt("");
                        setReviewVerificationCode("");
                      }}
                      disabled={isSubmitting}
                    >
                      Start again
                    </button>
                  </>
                ) : (
                  <>
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
                      <span>Phone number used for your service request</span>

                      <input
                        type="tel"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value)}
                        minLength={7}
                        maxLength={30}
                        autoComplete="tel"
                        required
                        placeholder="e.g. 0712 345 678"
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
                  </>
                )}

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
                      (reviewVerificationId
                        ? reviewVerificationCode.length !== 6
                        : false) ||
                      !customerName.trim() ||
                      (!reviewVerificationId &&
                        (!phone.trim() ||
                          !reviewText.trim() ||
                          rating === 0 ||
                          !serviceCategory))
                  }
                >
                    {isSubmitting
                      ? reviewVerificationId
                        ? "Verifying..."
                        : "Sending code..."
                      : reviewVerificationId
                        ? "Verify and Submit"
                        : "Submit Review"}
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
              Review submitted. Thankyou!
            </h4>

          </div>
        </div>
      )}
    </>
  );
}