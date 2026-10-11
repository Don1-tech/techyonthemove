
import styles from "./ConfirmationStep.module.css";
import TurnstileWidget from "../../../components/security/TurnstileWidget";

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
  turnstileToken: string;
  turnstileWidgetKey: number;
  turnstileSiteKey: string;
  onTurnstileTokenChange: (token: string) => void;

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
  turnstileToken,
  turnstileWidgetKey,
  turnstileSiteKey,
  onTurnstileTokenChange,
  onBack,
  onConfirm,
}: ConfirmationStepProps) {
  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return "Not selected";
    }

    // Keep date-only values independent of the browser's
    // timezone so the selected calendar date never shifts.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      dateString.trim(),
    );

    if (!match) {
      return dateString;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
      Date.UTC(year, month - 1, day),
    );

    // Reject invalid calendar dates such as 2026-02-31.
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return dateString;
    }

    return new Intl.DateTimeFormat("en-KE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  };

  const formatPrice = (price: number | null): string => {
    if (price === null || !Number.isFinite(price)) {
      return "Checking price...";
    }

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section
      className={styles.step}
      aria-labelledby="confirmation-heading"
    >
      <div className={styles.heading}>
        <h2 id="confirmation-heading">
          Review your service request
        </h2>

        <p>
          Please check your details, appointment, and
          estimated labour cost before confirming.
        </p>
      </div>

      <div className={styles.reviewContent}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div className={styles.serviceSummary}>
              <span className={styles.summaryLabel}>
                SERVICE
              </span>

              <h3>
                {serviceName || "Service not selected"}
              </h3>
            </div>

            <div className={styles.priceBox}>
              <span className={styles.priceLabel}>
                Approximate labour cost
              </span>

              <strong>
                {formatPrice(approximatePrice)}
              </strong>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.summarySection}>
            <h4>Service details</h4>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>
                Issue
              </span>

              <span className={styles.detailValue}>
                {issueDetails.trim() ||
                  "No issue details provided"}
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.summarySection}>
            <h4>Appointment</h4>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Date
                </span>

                <span className={styles.detailValue}>
                  {formatDate(selectedDate)}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Time
                </span>

                <span className={styles.detailValue}>
                  {selectedTime || "Not selected"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.summarySection}>
            <h4>Contact information</h4>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Name
                </span>

                <span className={styles.detailValue}>
                  {fullName.trim() || "Not provided"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Phone
                </span>

                <span className={styles.detailValue}>
                  {phone.trim() || "Not provided"}
                </span>
              </div>

              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Email
                </span>

                <span className={styles.detailValue}>
                  {email.trim() || "Not provided"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.summarySection}>
            <h4>Service location</h4>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>
                Location
              </span>

              <span className={styles.detailValue}>
                {location.trim() || "Not provided"}
              </span>
            </div>

            {directions.trim() && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  Directions
                </span>

                <span className={styles.detailValue}>
                  {directions.trim()}
                </span>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            className={styles.errorMessage}
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <div className={styles.securityCheck}>
          <p>Complete the security check to submit your request.</p>
          <TurnstileWidget
            key={turnstileWidgetKey}
            action="request_create"
            siteKey={turnstileSiteKey}
            onTokenChange={onTurnstileTokenChange}
          />
        </div>

        <div className={styles.notice}>
          <span
            className={styles.infoIcon}
            aria-hidden="true"
          >
            i
          </span>

          <div className={styles.noticeContent}>
            <p>
              <strong>About your price:</strong> The
              approximate price shown covers labour only.
              Hardware and materials are charged separately.
            </p>

            <p>
              Need hardware or materials? Go back to the
              issue details and list each item you need,
              including its quantity. Techy will review your
              requirements and provide a fuller quote when
              contacting you by phone.
            </p>
          </div>
        </div>

        {submitting && (
          <p
            className={styles.waitMessage}
            role="status"
            aria-live="polite"
          >
            Please wait while we process your service
            request. Do not close this window.
          </p>
        )}
      </div>

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
          disabled={submitting}
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>

        <button
          type="button"
          className={styles.confirmButton}
          onClick={onConfirm}
          disabled={submitting || !turnstileToken}
          aria-busy={submitting}
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

    </section>
  );
}
