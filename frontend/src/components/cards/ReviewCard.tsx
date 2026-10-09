import type { Review } from "../../types/review";

import styles from "../../sections/reviews/reviews.module.css";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({
  review,
}: ReviewCardProps) {
  const initials = review.customerName
    .trim()
    .split(/\s+/)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className={styles.reviewCard}>
      <div className={styles.reviewAvatar} aria-hidden="true">
        {initials}
      </div>

      <div className={styles.reviewCardContent}>
        <div className={styles.reviewTopRow}>
          <div className={styles.reviewIdentity}>
            <span className={styles.reviewName}>
              {review.customerName}
            </span>

            <span
              className={styles.reviewStars}
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"\u2605".repeat(review.rating)}
              {"\u2606".repeat(5 - review.rating)}
            </span>
          </div>

          {review.serviceCategory && (
            <span className={styles.reviewCategory}>
              {review.serviceCategory}
            </span>
          )}
        </div>

        <p className={styles.reviewText}>
          {review.reviewText}
        </p>
      </div>
    </article>
  );
}
