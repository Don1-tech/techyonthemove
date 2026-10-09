import styles from "./ConfirmationStep.module.css";

interface ConfirmationStepProps {
  serviceName: string;
  issueDetails: string;
  fullName: string;
  phone: string;
  email: string;
  location: string;
  directions: string;
  selectedDate: string;
  selectedTime: string;
  approximatePrice: number | null;
  submitting: boolean;
  error: string;

  onBack: () => void;
  onConfirm: () => void;
}

export default function ConfirmationStep({
  serviceName,
  issueDetails,
  fullName,
  phone,
  email,
  location,
  directions,
  selectedDate,
  selectedTime,
  approximatePrice,
  submitting,
  error,
  onBack,
  onConfirm,
}: ConfirmationStepProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) {
      return "Not selected";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateString;
    }

    return new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const formatPrice = (price: number | null) => {
    if (price === null) {
      return "Checking price...";
    }

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section className={styles.step}>
      <div className={styles.heading}>
        <h2>Review your service request</h2>

        <p>
          Please check the details below before confirming your request.
        </p>
      </div>

      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <span className={styles.summaryLabel}>SERVICE</span>

            <h3>{serviceName || "Service not selected"}</h3>
          </div>

          <div className={styles.priceBox}>
            <span className={styles.priceLabel}>
              Approximate price
            </span>

            <strong>{formatPrice(approximatePrice)}</strong>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.summarySection}>
          <h4>Service details</h4>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Issue</span>

            <span className={styles.detailValue}>
              {issueDetails || "No issue details provided"}
            </span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.summarySection}>
          <h4>Appointment</h4>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Date</span>

              <span className={styles.detailValue}>
                {formatDate(selectedDate)}
              </span>
            </div>

            {selectedTime && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Time</span>

                <span className={styles.detailValue}>
                  {selectedTime}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.summarySection}>
          <h4>Contact information</h4>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Name</span>

              <span className={styles.detailValue}>
                {fullName || "Not provided"}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Phone</span>

              <span className={styles.detailValue}>
                {phone || "Not provided"}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Email</span>

              <span className={styles.detailValue}>
                {email || "Not provided"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.summarySection}>
          <h4>Service location</h4>

          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Location</span>

            <span className={styles.detailValue}>
              {location || "Not provided"}
            </span>
          </div>

          {directions && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>
                Directions
              </span>

              <span className={styles.detailValue}>
                {directions}
              </span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          className={styles.errorMessage}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className={styles.notice}>
        <span
          className={styles.infoIcon}
          aria-hidden="true"
        >
          i
        </span>

        <p>
          The price shown is an approximate estimate. Our technician
          will confirm the final service cost after assessing the
          issue.
        </p>
      </div>

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={submitting}
        >
          ← Back
        </button>

        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span
                className={styles.processingDots}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </span>

              <span>Processing request...</span>
            </>
          ) : (
            <>
              <span>Confirm Request</span>

              <span aria-hidden="true">✓</span>
            </>
          )}
        </button>
      </div>

      {submitting && (
        <p
          className={styles.waitMessage}
          role="status"
          aria-live="polite"
        >
          Please wait while we process your service request.
        </p>
      )}
    </section>
  );
}