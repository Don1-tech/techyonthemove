import styles from "../ServiceRequestModal.module.css";

interface RequestModalFooterProps {
  canGoNext: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function RequestModalFooter({
  canGoNext,
  onBack,
  onNext,
}: RequestModalFooterProps) {
  return (
    <footer className={styles.modalFooter}>
      <button
        type="button"
        className={styles.backButton}
        onClick={onBack}
        disabled
      >
        BACK
      </button>

      <button
        type="button"
        className={styles.nextButton}
        onClick={onNext}
        disabled={!canGoNext}
      >
        NEXT
      </button>
    </footer>
  );
}