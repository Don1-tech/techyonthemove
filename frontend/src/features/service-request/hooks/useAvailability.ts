import { useEffect, useState } from "react";

import {
  getAvailability,
  getAvailabilityForDate,
} from "../../../api/availabilityApi";

import type {
  AvailabilityDay,
} from "../../../types/availability";

interface UseAvailabilityResult {
  availability: AvailabilityDay[];
  selectedDay: AvailabilityDay | null;
  loading: boolean;
  loadingSelectedDate: boolean;
  error: string;
}

export default function useAvailability(
  selectedDate: string
): UseAvailabilityResult {
  const [availability, setAvailability] =
    useState<AvailabilityDay[]>([]);

  const [selectedDayResult, setSelectedDayResult] =
    useState<{
      date: string;
      availability: AvailabilityDay;
    } | null>(null);

  const selectedDay =
    selectedDayResult?.date === selectedDate
      ? selectedDayResult.availability
      : null;

  const [loading, setLoading] =
    useState(true);

  const [availabilityError, setAvailabilityError] = useState("");
  const [selectedDateError, setSelectedDateError] =
    useState<{ date: string; message: string } | null>(null);

  const error =
    availabilityError ||
    (selectedDateError?.date === selectedDate
      ? selectedDateError.message
      : "");
  const loadingSelectedDate = Boolean(
    selectedDate &&
      !selectedDay &&
      selectedDateError?.date !== selectedDate
  );

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      setLoading(true);
      setAvailabilityError("");

      try {
        const data = await getAvailability();

        if (cancelled) {
          return;
        }

        setAvailability(data);
      } catch {
        if (!cancelled) {
          setAvailabilityError(
            "We could not load available service dates. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    let cancelled = false;
    const date = selectedDate;

    void getAvailabilityForDate(date)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setSelectedDayResult({
          date,
          availability: data,
        });
        setSelectedDateError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        setSelectedDateError({
          date,
          message:
            error instanceof Error
              ? error.message
              : "We could not check availability for that date. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  return {
    availability,
    selectedDay,
    loading,
    loadingSelectedDate,
    error,
  };
}