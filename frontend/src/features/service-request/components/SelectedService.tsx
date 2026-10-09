import styles from "../ServiceRequestModal.module.css";

interface SelectedServiceProps {
  serviceId: string;
  serviceName: string;
  onSelect: (serviceId: string, serviceName: string) => void;
}

export default function SelectedService({
  serviceId,
  serviceName,
  onSelect,
}: SelectedServiceProps) {
  return (
    <button
      type="button"
      className={styles.serviceOption}
      onClick={() => onSelect(serviceId, serviceName)}
      aria-pressed={false}
    >
      <span className={styles.serviceIcon}>
        <span aria-hidden="true">•</span>
      </span>

      <span className={styles.serviceName}>
        {serviceName}
      </span>
    </button>
  );
}