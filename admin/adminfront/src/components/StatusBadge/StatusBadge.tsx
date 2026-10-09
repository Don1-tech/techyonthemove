import type { RequestStatus } from "../../types/request";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: RequestStatus;
}

/*
 * Database/API status → Admin display
 *
 * pending   → Pending
 * confirmed → Confirmed
 * completed → Completed
 * cancelled → Cancelled
 */

const labels: Record<RequestStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[status]}`}
    >
      <span
        className={styles.dot}
        aria-hidden="true"
      />

      {labels[status]}
    </span>
  );
}