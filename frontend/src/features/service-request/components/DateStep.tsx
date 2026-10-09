import { useEffect, useState } from "react";

import { getAvailableDates } from "../../../api/availabilityApi";
import styles from "./DateStep.module.css";

interface DateStepProps {
  value?: string;
  onBack: () => void;
  onContinue: (date: string) => void;
}

interface AvailableDate {
  date: string;
  available: boolean;
}

export default function DateStep({
  value = "",
  onBack,
  onContinue,
}: DateStepProps) {
  const [dates, setDates] = useState<AvailableDate[]>([]);
  const [selectedDate, setSelectedDate] = useState(value);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDates = async () => {
      setLoading(true);
      setError("");

      try {
        const data: AvailableDate[] = await getAvailableDates();

        if (cancelled) {
          return;
        }

        setDates(data);

        const selectedDateStillAvailable = data.some(
          (item) =>
            item.date === value &&
            item.available
        );

        if (!selectedDateStillAvailable) {
          setSelectedDate("");
        }
      } catch {
        if (!cancelled) {
          setError(
            "No dates available. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDates();

    return () => {
      cancelled = true;
    };
  }, [value]);

  const handleDateSelect = (date: AvailableDate) => {
    if (!date.available) {
      return;
    }

    setSelectedDate(date.date);
  };

  const handleContinue = () => {
    if (!selectedDate) {
      return;
    }

    onContinue(selectedDate);
  };

  const formatDay = (dateString: string) => {
    return new Intl.DateTimeFormat("en-KE", {
      weekday: "short",
    }).format(new Date(`${dateString}T00:00:00`));
  };

  const formatDayNumber = (dateString: string) => {
    return new Intl.DateTimeFormat("en-KE", {
      day: "numeric",
    }).format(new Date(`${dateString}T00:00:00`));
  };

  const formatMonth = (dateString: string) => {
    return new Intl.DateTimeFormat("en-KE", {
      month: "short",
    }).format(new Date(`${dateString}T00:00:00`));
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>
        <h2>
          Select an available date for your technician visit.
        </h2>
      </div>

      <div className={styles.content}>
        <div className={styles.sectionHeader}>
          <div>
            <p>
              Dates that are already fully booked cannot be selected.
            </p>
          </div>
        </div>

        {loading && (
          <div className={styles.statusMessage}>
            <span className={styles.spinner} />
            <span>Checking available dates...</span>
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {!loading && !error && dates.length === 0 && (
          <div className={styles.emptyMessage}>
            No service dates are currently available.
          </div>
        )}

        {!loading && !error && dates.length > 0 && (
          <div className={styles.dateGrid}>
            {dates.map((date) => {
              const selected =
                selectedDate === date.date;

              return (
                <button
                  key={date.date}
                  type="button"
                  className={[
                    styles.dateCard,
                    !date.available
                      ? styles.unavailable
                      : "",
                    selected
                      ? styles.selected
                      : "",
                  ].join(" ")}
                  disabled={!date.available}
                  onClick={() =>
                    handleDateSelect(date)
                  }
                  aria-pressed={
                    date.available
                      ? selected
                      : undefined
                  }
                  aria-label={
                    date.available
                      ? `Select ${formatDay(date.date)} ${formatDayNumber(date.date)} ${formatMonth(date.date)}`
                      : `${formatDay(date.date)} ${formatDayNumber(date.date)} ${formatMonth(date.date)} is unavailable`
                  }
                >
                  <span className={styles.dayName}>
                    {formatDay(date.date)}
                  </span>

                  <span className={styles.dayNumber}>
                    {formatDayNumber(date.date)}
                  </span>

                  <span className={styles.monthName}>
                    {formatMonth(date.date)}
                  </span>

                  {!date.available && (
                    <span className={styles.unavailableLabel}>
                      Fully booked
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {!loading && !error && dates.length > 0 && (
          <div className={styles.note}>
            <span className={styles.infoIcon}>i</span>

            <span>
              Grey dates are fully booked. Select one of the
              available dates to continue.
            </span>
          </div>
        )}
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
          disabled={!selectedDate || loading || !!error}
          onClick={handleContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}