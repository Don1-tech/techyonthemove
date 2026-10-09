
import styles from "./SuccessStep.module.css";

interface SuccessStepProps {
  requestReference: string;
  phoneNumber?: string;
  approximatePrice?: string | number;
  email?: string;
  onDone: () => void;
}

export default function SuccessStep({
  requestReference,
  phoneNumber,
  approximatePrice,
  onDone,
}: SuccessStepProps) {
  const formattedPrice =
    approximatePrice === undefined ||
    approximatePrice === null ||
    approximatePrice === ""
      ? null
      : typeof approximatePrice === "number"
        ? `KSh ${approximatePrice.toLocaleString("en-KE")}`
        : approximatePrice;

  return (
    <section className={styles.step}>
      <div
        className={styles.confetti}
        aria-hidden="true"
      >
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* SUCCESS CHECKMARK */}
      <div
        className={styles.successIcon}
        aria-label="Request submitted successfully"
        role="img"
      >
        <span aria-hidden="true">✓</span>
      </div>

      {/* HEADING */}
      <div className={styles.heading}>
        <p className={styles.eyebrow}>
          REQUEST RECEIVED
        </p>

        <h2>Request submitted successfully!</h2>

        <p>
          Thank you for choosing Techy On The Move.
        </p>
      </div>

      {/* REQUEST NUMBER */}
      <div className={styles.referenceCard}>
        <span className={styles.referenceLabel}>
          YOUR REQUEST NUMBER
        </span>

        <strong>{requestReference}</strong>

        <span className={styles.referenceHint}>
          Keep this number for reference.
        </span>
      </div>

      {/* APPROXIMATE PRICE */}
      {formattedPrice && (
        <div className={styles.priceCard}>
          <span className={styles.priceLabel}>
            APPROXIMATE SERVICE PRICE
          </span>

          <strong>{formattedPrice}</strong>

          <span className={styles.priceHint}>
            The final cost may depend on the issue
            and the work required.
          </span>
        </div>
      )}

      {/* PHONE CONFIRMATION MESSAGE */}
      <div className={styles.message}>
        <p className={styles.confirmationText}>
          Your request has been submitted.
        </p>

        <p>
          A Techy will be contacting you soon on
        </p>

        {phoneNumber ? (
          <strong className={styles.phoneNumber}>
            {phoneNumber}
          </strong>
        ) : (
          <strong className={styles.phoneNumber}>
            the phone number you provided
          </strong>
        )}

        <p className={styles.finalMessage}>
          to confirm your request.
        </p>
      </div>

      {/* DONE BUTTON */}
      <button
        type="button"
        className={styles.doneButton}
        onClick={onDone}
      >
        Done
        <span aria-hidden="true">✓</span>
      </button>
    </section>
  );
}
