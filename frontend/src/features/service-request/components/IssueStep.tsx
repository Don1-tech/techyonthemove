import { useState } from "react";
import styles from "./IssueStep.module.css";

type IssueDetailsStepProps = {
  value?: string;
  onBack: () => void;
  onContinue: (details: string) => void;
};

export default function IssueDetailsStep({
  value = "",
  onBack,
  onContinue,
}: IssueDetailsStepProps) {
  const [details, setDetails] = useState(value);

  const canContinue = details.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;

    onContinue(details.trim());
  };

  return (
    <div className={styles.step}>
      {/* =====================================================
          HEADING
          ===================================================== */}

      <div className={styles.heading}>
        <h2>Tell us about the issue</h2>

      
      </div>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className={styles.content}>
        <div className={styles.fieldGroup}>
          <label htmlFor="issue-details">
            What is the problem?
            <span className={styles.required}>*</span>
          </label>

          <textarea
            id="issue-details"
            className={styles.textarea}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="For example: My Wi-Fi keeps disconnecting every few minutes..."
            rows={7}
            maxLength={1000}
          />

          <div className={styles.fieldFooter}>
            <div className={styles.hintPill}>
              <span className={styles.infoIcon}>i</span>

              <span>
                Include error codes, warning messages, or things you've already
                tried.
              </span>
            </div>

            <span className={styles.characterCount}>
              {details.length}/1000
            </span>
          </div>
        </div>

        {/* ===================================================
            ADDITIONAL INFORMATION
            =================================================== */}

        <div className={styles.fieldGroup}>
          <label htmlFor="additional-information">
            Additional information
            <span className={styles.optional}>(optional)</span>
          </label>

          <textarea
            id="additional-information"
            className={`${styles.textarea} ${styles.smallTextarea}`}
            placeholder="Anything else that may help the technician..."
            rows={3}
            maxLength={500}
          />

        </div>
      </div>

      {/* =====================================================
          ACTION BAR
          ===================================================== */}

      <div className={styles.actionBar}>
        <button
          type="button"
          className={styles.backButton}
          onClick={onBack}
        >
          ← Back
        </button>

        <button
          type="button"
          className={styles.continueButton}
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}