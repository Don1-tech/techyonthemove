import { useEffect, useState } from "react";

import type { ServiceRequest } from "../../types/request";
import { formatCustomerName } from "../../utils/format";
import { copyText } from "../../utils/copyText";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./RequestCard.module.css";

interface RequestCardProps {
  request: ServiceRequest;
  onOpen: (request: ServiceRequest) => void;
}

export function RequestCard({
  request,
  onOpen,
}: RequestCardProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!copyMessage) return;
    const timer = window.setTimeout(() => setCopyMessage(""), 2400);
    return () => window.clearTimeout(timer);
  }, [copyMessage]);

  async function handleCopyReference() {
    try {
      await copyText(request.reference);
      setCopyFailed(false);
      setCopyMessage("Reference copied");
    } catch {
      setCopyFailed(true);
      setCopyMessage("Could not copy reference");
    }
  }

  return (
    <article className={styles.card} role="listitem">
      <div className={styles.identity}>
        <h3 className={styles.customer}>
          {formatCustomerName(request.fullName)}
        </h3>
        <StatusBadge status={request.status} />
      </div>

      <div className={styles.metadata}>
        <div className={styles.referenceGroup}>
          <span className={styles.reference}>{request.reference}</span>
          <button
            type="button"
            className={styles.copyButton}
            onClick={() => void handleCopyReference()}
            aria-label={`Copy request reference ${request.reference}`}
            title="Copy request reference"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <rect x="7" y="7" width="9" height="10" rx="1.5" />
              <path d="M12 7V4.5A1.5 1.5 0 0 0 10.5 3h-6A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7" />
            </svg>
          </button>
        </div>
        <span className={styles.service}>
          {request.serviceName || request.serviceId}
        </span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryAction}
          onClick={() => onOpen(request)}
          aria-label={`View details for ${formatCustomerName(request.fullName)}, request ${request.reference}`}
        >
          View details
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {copyMessage && (
        <span
          className={`${styles.copyToast} ${
            copyFailed ? styles.copyError : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {copyMessage}
        </span>
      )}
    </article>
  );
}
