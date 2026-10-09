
import type { ServiceRequest } from "../../types/request";
import { formatDate } from "../../utils/format";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./RequestCard.module.css";

interface RequestCardProps {
  request: ServiceRequest;
  onOpen: (request: ServiceRequest) => void;
  onStatusChange: (
    id: string,
    status: ServiceRequest["status"],
  ) => void;
}

export function RequestCard({
  request,
  onOpen,
}: RequestCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <button
          type="button"
          className={styles.reference}
          onClick={() => onOpen(request)}
        >
          {request.reference}
        </button>

        <StatusBadge status={request.status} />
      </div>

      <h3 className={styles.customer}>
        {request.fullName}
      </h3>

      <div className={styles.serviceRow}>
        <span className={styles.service}>
          {request.serviceName}
        </span>

        <span className={styles.issue}>
          {request.issueDetails}
        </span>
      </div>

      <div className={styles.meta}>
        <span>
          {request.location}
        </span>

        <span className={styles.metaSeparator}>
          •
        </span>

        <span>
          {formatDate(request.requestedDate)}
        </span>

        <span className={styles.metaSeparator}>
          •
        </span>

        <span>
          {request.requestedTime}
        </span>
      </div>
    </article>
  );
}
