import styles from "../ServiceRequestModal.module.css";

interface ServiceRequestHeaderProps {
  onClose: () => void;
}

export default function ServiceRequestHeader({
  onClose,
}: ServiceRequestHeaderProps) {
  return (
    <header className={styles.modalHeader}>
      <div className={styles.headerText}>
        <span className={styles.headerLabel}>
          Request a service
        </span>

        <h2>Techy service booking</h2>
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close request service"
      >
        ×
      </button>
    </header>
  );
}