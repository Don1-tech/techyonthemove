import styles from "./SlotButton.module.css";

interface SlotButtonProps {
  time: string;
  selected: boolean;
  available: boolean;
  onClick: () => void;
}

export default function SlotButton({
  time,
  selected,
  available,
  onClick,
}: SlotButtonProps) {
  return (
    <button
      type="button"
      className={[
        styles.slotButton,
        selected ? styles.selected : "",
        !available ? styles.unavailable : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={!available}
      onClick={onClick}
      aria-pressed={available ? selected : undefined}
    >
      <span className={styles.time}>
        {time}
      </span>

      <span className={styles.status}>
        {available
          ? selected
            ? "Selected"
            : "Available"
          : "Booked"}
      </span>
    </button>
  );
}