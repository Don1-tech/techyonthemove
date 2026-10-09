import styles from "./reviews.module.css";
import ReviewsList from "./ReviewsList";

export default function Reviews() {
  return (
    <section
      id="reviews"
      className={styles.reviews}
      aria-labelledby="reviews-heading"
    >
      <div className={styles.reviewsInner}>
        <header className={styles.sectionHeader}>
          <h2 id="reviews-heading">REVIEWS</h2>

          <p>
            What our customer have to say about their experience with us.
          </p>
        </header>

        <ReviewsList />
      </div>
    </section>
  );
}