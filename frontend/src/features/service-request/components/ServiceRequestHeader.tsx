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
          Requesting  Service
        </span>

      
       
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        aria-label="Close request service"
      >
        X
      </button>
    </header>
  );
}