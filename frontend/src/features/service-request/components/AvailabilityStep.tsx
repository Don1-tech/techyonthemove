import { useState } from "react";

import styles from "./AvailabilityStep.module.css";

import SlotButton from "./SlotButton";

import useAvailability from "../hooks/useAvailability";

interface AvailabilityStepProps {
  value?: {
    date?: string;
    time?: string;
  };

  onBack: () => void;

  onContinue: (
    date: string,
    time: string
  ) => void;
}

export default function AvailabilityStep({
  value,
  onBack,
  onContinue,
}: AvailabilityStepProps) {
  const [selectedDate, setSelectedDate] =
    useState(value?.date ?? "");

  const [selectedTime, setSelectedTime] =
    useState(value?.time ?? "");

  const {
    availability,
    selectedDay,
    loading,
    loadingSelectedDate,
    error,
  } = useAvailability(selectedDate);

  const handleDateSelect = (
    date: string
  ) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (
    time: string
  ) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    const selectedSlotIsAvailable =
      selectedDay?.slots.some(
        (slot) =>
          slot.time === selectedTime &&
          slot.available
      );

    if (
      !selectedDate ||
      !selectedTime ||
      !selectedSlotIsAvailable
    ) {
      return;
    }

    onContinue(
      selectedDate,
      selectedTime
    );
  };

  const formatDay = (
    dateString: string
  ) => {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        weekday: "short",
      }
    ).format(
      new Date(
        `${dateString}T00:00:00`
      )
    );
  };

  const formatDayNumber = (
    dateString: string
  ) => {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        day: "numeric",
      }
    ).format(
      new Date(
        `${dateString}T00:00:00`
      )
    );
  };

  const formatMonth = (
    dateString: string
  ) => {
    return new Intl.DateTimeFormat(
      "en-KE",
      {
        month: "short",
      }
    ).format(
      new Date(
        `${dateString}T00:00:00`
      )
    );
  };

  return (
    <div className={styles.step}>
      <div className={styles.heading}>
        <h2>
          Choose a date and time for your technician visit.
        </h2>

        <p>
          Select an available date, then choose one of the available time slots.
        </p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <h3>Select a date</h3>

            <span>
              {loading
                ? "Checking availability..."
                : "Available dates"}
            </span>
          </div>

          {loading && (
            <div className={styles.statusMessage}>
              <span className={styles.spinner} />
              <span>
                Checking available dates...
              </span>
            </div>
          )}

          {!loading &&
            !error &&
            availability.length > 0 && (
              <div className={styles.dateGrid}>
                {availability.map((day) => {
                  const selected =
                    selectedDate === day.date;

                  const hasAvailableSlot =
                    day.slots.some(
                      (slot) =>
                        slot.available
                    );

                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={[
                        styles.dateCard,
                        selected
                          ? styles.selected
                          : "",
                        !hasAvailableSlot
                          ? styles.unavailable
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      disabled={
                        !hasAvailableSlot
                      }
                      onClick={() =>
                        handleDateSelect(
                          day.date
                        )
                      }
                      aria-pressed={
                        hasAvailableSlot
                          ? selected
                          : undefined
                      }
                    >
                      <span
                        className={
                          styles.dayName
                        }
                      >
                        {formatDay(
                          day.date
                        )}
                      </span>

                      <span
                        className={
                          styles.dayNumber
                        }
                      >
                        {formatDayNumber(
                          day.date
                        )}
                      </span>

                      <span
                        className={
                          styles.monthName
                        }
                      >
                        {formatMonth(
                          day.date
                        )}
                      </span>

                      {!hasAvailableSlot && (
                        <span
                          className={
                            styles.unavailableLabel
                          }
                        >
                          Fully booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          {!loading &&
            !error &&
            availability.length === 0 && (
              <div className={styles.emptyMessage}>
                No service dates are currently available.
              </div>
            )}
        </section>

        {selectedDate && (
          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <div>
                <h3>Select a time</h3>

                <span>
                  {loadingSelectedDate
                    ? "Checking selected date..."
                    : "Available time slots"}
                </span>
              </div>
            </div>

            {loadingSelectedDate && (
              <div
                className={
                  styles.statusMessage
                }
              >
                <span
                  className={styles.spinner}
                />

                <span>
                  Checking available time slots...
                </span>
              </div>
            )}

            {!loadingSelectedDate &&
              selectedDay && (
                <div
                  className={
                    styles.slotGrid
                  }
                >
                  {selectedDay.slots.map(
                    (slot) => (
                      <SlotButton
                        key={slot.time}
                        time={slot.time}
                        available={
                          slot.available
                        }
                        selected={
                          selectedTime === slot.time &&
                          slot.available
                        }
                        onClick={() =>
                          handleTimeSelect(
                            slot.time
                          )
                        }
                      />
                    )
                  )}
                </div>
              )}
          </section>
        )}

        {error && (
          <div
            className={styles.errorMessage}
            role="alert"
          >
            {error}
          </div>
        )}

        {selectedDate &&
          selectedTime &&
          !loadingSelectedDate && (
            <div className={styles.selectionSummary}>
              <span
                className={
                  styles.infoIcon
                }
              >
                ✓
              </span>

              <span>
                Your selected appointment is{" "}
                <strong>
                  {formatDay(
                    selectedDate
                  )}{" "}
                  {formatDayNumber(
                    selectedDate
                  )}{" "}
                  {formatMonth(
                    selectedDate
                  )}
                </strong>{" "}
                at{" "}
                <strong>
                  {selectedTime}
                </strong>
                .
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
          disabled={
            !selectedDate ||
            !selectedTime ||
            loading ||
            loadingSelectedDate ||
            !!error ||
            !selectedDay?.slots.some(
              (slot) =>
                slot.time === selectedTime &&
                slot.available
            )
          }
          onClick={handleContinue}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}