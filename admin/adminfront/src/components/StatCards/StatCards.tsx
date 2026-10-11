import type { DashboardCounts } from "../../types/dashboard";
import styles from "./StatCards.module.css";

interface StatCardsProps {
  counts: DashboardCounts;
  state: "loading" | "unavailable" | "ready";
}

export function StatCards({
  counts,
  state,
}: StatCardsProps) {
  const cards = [
    {
      label: "Pending",
      value: counts.pending,
      key: "pending",
    },
    {
      label: "Confirmed",
      value: counts.confirmed,
      key: "confirmed",
    },
    {
      label: "Completed",
      value: counts.completed,
      key: "completed",
    },
    {
      label: "Cancelled",
      value: counts.cancelled,
      key: "cancelled",
    },
  ];

  return (
    <section className={styles.container} aria-label="Request totals by status">
      {cards.map((card) => (
        <article
          key={card.key}
          className={`${styles.card} ${styles[card.key]}`}
          aria-busy={state === "loading"}
        >
          <span className={styles.label}>
            <span className={styles.marker} aria-hidden="true" />
            {card.label}
          </span>
          <strong className={styles.value} aria-label={`${card.label} requests`}>
            {state === "ready" ? card.value : "—"}
          </strong>
        </article>
      ))}
    </section>
  );
}