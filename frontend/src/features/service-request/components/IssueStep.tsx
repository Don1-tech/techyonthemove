
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
  const [additionalInformation, setAdditionalInformation] = useState("");

  const canContinue = details.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;

    const combinedDetails = [
      details.trim(),
      additionalInformation.trim()
        ? `Additional information: ${additionalInformation.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    onContinue(combinedDetails);
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>
        <h2>Tell us about the issue</h2>
      </div>

      <div className={styles.content}>
        <div className={styles.fieldGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="issue-details">
              What is the problem?
              <span className={styles.required}>*</span>
            </label>

            <div
              className={styles.hardwareTip}
              role="note"
              title="Mention any extra hardware or materials you may need."
            >
              <span className={styles.infoIcon} aria-hidden="true">
                i
              </span>
              <span>
                Need extra hardware or materials? Tell us for a fuller quote.
              </span>
            </div>
          </div>

          <textarea
            id="issue-details"
            className={styles.textarea}
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="For example: My Wi-Fi keeps disconnecting every few minutes..."
            rows={7}
            maxLength={1000}
            required
          />

          <div className={styles.fieldFooter}>
            <div className={styles.hintPill}>
              <span className={styles.infoIcon} aria-hidden="true">
                i
              </span>

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

        <div className={styles.fieldGroup}>
        

          <textarea
            id="additional-information"
            className={`${styles.textarea} ${styles.smallTextarea}`}
            value={additionalInformation}
            onChange={(event) =>
              setAdditionalInformation(event.target.value)
            }
            placeholder="List extra hardware, materials, quantities, or anything else the technician should know..."
            rows={3}
            maxLength={500}
          />

          <div className={styles.fieldFooter}>
            <span className={styles.characterCount}>
              {additionalInformation.length}/500
            </span>
          </div>
        </div>
      </div>

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
