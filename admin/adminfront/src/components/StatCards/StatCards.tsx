import type { DashboardCounts } from "../../types/dashboard";
import styles from "./StatCards.module.css";

interface StatCardsProps {
  counts: DashboardCounts;
}

export function StatCards({
  counts,
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
  ];

  return (
    <section className={styles.container}>
      {cards.map((card) => (
        <div
          key={card.key}
          className={styles.card}
        >
          <span className={styles.label}>
            {card.label}
          </span>

          <strong className={styles.value}>
            {card.value}
          </strong>
        </div>
      ))}
    </section>
  );
}