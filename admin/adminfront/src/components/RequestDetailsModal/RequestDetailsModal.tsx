import { useEffect, useRef, useState } from "react";

import type {
  RequestStatus,
  ServiceRequest,
} from "../../types/request";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatAppointmentTime,
  formatCustomerName,
} from "../../utils/format";
import { copyText } from "../../utils/copyText";
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

  const [success, setSuccess] = useState("");
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const phoneNumber = request.phone.replace(/[^\d+]/g, "");
  const location = request.location.trim();
  const additionalInfoMarker = "\n\nAdditional information:";
  const additionalInfoIndex = request.issueDetails.indexOf(additionalInfoMarker);
  const issueDescription =
    additionalInfoIndex === -1
      ? request.issueDetails
      : request.issueDetails.slice(0, additionalInfoIndex).trimEnd();
  const additionalInformation =
    additionalInfoIndex === -1
      ? ""
      : request.issueDetails
          .slice(additionalInfoIndex + additionalInfoMarker.length)
          .trim();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const updatingRef = useRef(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !updatingRef.current) {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus?.isConnected) {
        previousFocus.focus();
      } else {
        document.getElementById("request-search")?.focus();
      }
    };
  }, []);

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

  const handleStatusChange = async (status: RequestStatus) => {
    if (updating) {
      return;
    }

    try {
      setUpdating(true);
      updatingRef.current = true;
      setError(null);
      setSuccess("");

      await onStatusChange(request.id, status);
      setConfirmCancellation(false);
      setSuccess(
        `Request status updated to ${status.charAt(0).toUpperCase() + status.slice(1)}.`,
      );
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "The request status could not be updated.",
      );
    } finally {
      updatingRef.current = false;
      setUpdating(false);
    }
  };

  async function handleCopyReference() {
    try {
      await copyText(request.reference);
      setCopyMessage("Reference copied.");
    } catch {
      setCopyMessage("Could not copy the reference.");
    }
  }

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !updating) {
          onClose();
        }
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
        ref={dialogRef}
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
            <button
              type="button"
              className={styles.copyReference}
              onClick={() => void handleCopyReference()}
            >
              Copy reference
            </button>
            <span className={styles.copyStatus} role="status">
              {copyMessage}
            </span>
          </div>

          <button
            ref={closeButtonRef}
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
              Submitted {formatDateTime(request.createdAt)}
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
                value={formatCustomerName(request.fullName)}
              />

              {/\d/.test(phoneNumber) && (
                <Info
                  label="Phone"
                  value={request.phone}
                  href={`tel:${phoneNumber}`}
                  linkLabel={`Call customer at ${request.phone}`}
                />
              )}

              {request.email && (
                <Info label="Email" value={request.email} href={`mailto:${request.email}`} />
              )}
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

              {request.approximatePrice !== null && (
                <Info label="Approximate price" value={formatCurrency(request.approximatePrice)} />
              )}

            </div>

            <div className={styles.issue}>
              <span>Description</span>
              <p>{issueDescription || "No issue description provided."}</p>
            </div>
            {additionalInformation && (
              <div className={styles.issue}>
                <span>Additional information</span>
                <p>{additionalInformation}</p>
              </div>
            )}
          </section>

          {(request.requestedDate ||
            request.requestedTime ||
            location ||
            request.directions) && (
            <section className={styles.section}>
              <h3>Appointment and location</h3>
              <div className={styles.grid}>
                {request.requestedDate && (
                  <Info
                    label="Appointment date"
                    value={formatDate(request.requestedDate)}
                  />
                )}
                {request.requestedTime && (
                  <Info
                    label="Appointment time"
                    value={formatAppointmentTime(request.requestedTime)}
                  />
                )}
                {location && (
                  <Info
                    label="Location"
                    value={location}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                    linkLabel={`Open ${location} in Google Maps`}
                    external
                  />
                )}
                {request.directions && (
                  <Info label="Directions" value={request.directions} />
                )}
              </div>
            </section>
          )}

          <section className={styles.section}>
            <h3>Request metadata</h3>
            <div className={styles.grid}>
              <Info label="Submitted" value={formatDateTime(request.createdAt)} />
              <Info label="Last updated" value={formatDateTime(request.updatedAt)} />
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
        {success && (
          <div className={styles.success} role="status">
            {success}
          </div>
        )}

        {/* =================================================
            ACTIONS
            ================================================= */}

        {(nextStatus ||
          ((request.status === "pending" || request.status === "confirmed") &&
            confirmCancellation)) && (
          <>
            {confirmCancellation && (
              <div
                className={styles.cancelConfirmation}
                role="group"
                aria-label="Confirm request cancellation"
              >
                <p>Cancel this request? This cannot be undone.</p>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setConfirmCancellation(false)}
                  disabled={updating}
                >
                  Keep request
                </button>
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => void handleStatusChange("cancelled")}
                  disabled={updating}
                >
                  {updating ? "Cancelling…" : "Confirm cancellation"}
                </button>
              </div>
            )}
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={updating}
            >
              Close
            </button>

            {nextStatus && !confirmCancellation && (
              <button
                type="button"
                className={styles.primary}
                onClick={() => void handleStatusChange(nextStatus)}
                disabled={updating}
              >
                {updating
                  ? "Updating..."
                  : nextStatus === "confirmed"
                    ? "Mark as Confirmed"
                    : "Mark Completed"}
              </button>
            )}
            {(request.status === "pending" ||
              request.status === "confirmed") &&
              !confirmCancellation && (
                <button
                  type="button"
                  className={styles.danger}
                  onClick={() => setConfirmCancellation(true)}
                  disabled={updating}
                >
                  Cancel request
                </button>
              )}
          </footer>
          </>
        )}
        {!nextStatus && (
          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onClose}
              disabled={updating}
            >
              Close
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
  href,
  linkLabel,
  external = false,
}: {
  label: string;
  value: string;
  href?: string;
  linkLabel?: string;
  external?: boolean;
}) {
  return (
    <div className={styles.info}>
      <span>{label}</span>

      <strong>
        {href ? (
          <a
            href={href}
            aria-label={linkLabel}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
          >
            {label === "Phone" && (
              <svg
                className={styles.phoneIcon}
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M6.1 2.8 8.3 6l-1.4 1.7a12 12 0 0 0 5.4 5.4l1.7-1.4 3.2 2.2-.5 2.4c-.1.6-.7 1-1.3 1A14.6 14.6 0 0 1 2.7 4.6c0-.6.4-1.2 1-1.3l2.4-.5Z" />
              </svg>
            )}
            {value}
          </a>
        ) : (
          value
        )}
      </strong>
    </div>
  );
}