import { useState } from "react";

import type { ServiceRequest } from "../../types/request";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from "../../utils/format";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./RequestDetailsModal.module.css";

interface RequestDetailsModalProps {
  request: ServiceRequest;
  onClose: () => void;
  onStatusChange: (
    id: string,
    status: ServiceRequest["status"],
  ) => Promise<ServiceRequest | void>;
}

export function RequestDetailsModal({
  request,
  onClose,
  onStatusChange,
}: RequestDetailsModalProps) {
  const [updating, setUpdating] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Database status:
   *
   * pending   → confirmed
   * confirmed → completed
   *
   * The frontend uses the same status names
   * as the database and backend.
   */
  const nextStatus =
    request.status === "pending"
      ? "confirmed"
      : request.status === "confirmed"
        ? "completed"
        : null;

  /* =========================================================
     STATUS CHANGE
     ========================================================= */

  const handleStatusChange = async () => {
    if (!nextStatus || updating) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      /*
       * Wait for the backend to successfully update
       * PostgreSQL before closing the modal.
       */
      await onStatusChange(
        request.id,
        nextStatus,
      );

      /*
       * Only close after the update succeeds.
       */
      onClose();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "The request status could not be updated.",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
      >
        {/* =================================================
            HEADER
            ================================================= */}

        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>
              SERVICE REQUEST
            </span>

            <h2 id="request-details-title">
              {request.reference}
            </h2>
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={updating}
            aria-label="Close request details"
          >
            ×
          </button>
        </header>

        {/* =================================================
            CONTENT
            ================================================= */}

        <div className={styles.content}>
          <div className={styles.statusRow}>
            <StatusBadge status={request.status} />

            <span>
              Submitted{" "}
              {formatDateTime(
                request.createdAt,
              )}
            </span>
          </div>

          {/* =================================================
              CUSTOMER
              ================================================= */}

          <section className={styles.section}>
            <h3>Customer</h3>

            <div className={styles.grid}>
              <Info
                label="Name"
                value={request.fullName}
              />

              <Info
                label="Phone"
                value={request.phone}
              />

              <Info
                label="Email"
                value={request.email}
              />
            </div>
          </section>

          {/* =================================================
              REQUEST
              ================================================= */}

          <section className={styles.section}>
            <h3>Request</h3>

            <div className={styles.grid}>
              <Info
                label="Service"
                value={
                  request.serviceName ||
                  request.serviceId
                }
              />

              <Info
                label="Approx. price"
                value={formatCurrency(
                  request.approximatePrice,
                )}
              />

              <Info
                label="Date"
                value={formatDate(
                  request.requestedDate,
                )}
              />

              <Info
                label="Time"
                value={
                  request.requestedTime
                }
              />

              <Info
                label="Location"
                value={request.location}
              />

              <Info
                label="Directions"
                value={
                  request.directions ||
                  "Not provided"
                }
              />
            </div>

            <div className={styles.issue}>
              <span>Issue details</span>

              <p>
                {request.issueDetails}
              </p>
            </div>
          </section>
        </div>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div
            className={styles.error}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* =================================================
            ACTIONS
            ================================================= */}

        {nextStatus && (
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={updating}
            >
              Close
            </button>

            <button
              type="button"
              className={styles.primary}
              onClick={handleStatusChange}
              disabled={updating}
            >
              {updating
                ? "Updating..."
                : nextStatus === "confirmed"
                  ? "Mark as Confirmed"
                  : "Mark Completed"}

              {!updating && (
                <span aria-hidden="true">
                  →
                </span>
              )}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   INFO FIELD
   ========================================================= */

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.info}>
      <span>{label}</span>

      <strong>
        {value}
      </strong>
    </div>
  );
}