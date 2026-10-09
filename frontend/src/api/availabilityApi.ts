import type {
  AvailabilityDay,
  AvailabilityResponse,
} from "../types/availability";

import { API_BASE_URL } from "./config";

export async function getAvailability(): Promise<AvailabilityDay[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/availability`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load service availability."
    );
  }

  const data: AvailabilityResponse =
    await response.json();

  return data.availability;
}

export async function getAvailabilityForDate(
  date: string
): Promise<AvailabilityDay> {
  const response = await fetch(
    `${API_BASE_URL}/api/availability?date=${encodeURIComponent(
      date
    )}`
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load availability for the selected date."
    );
  }

  const data: AvailabilityResponse =
    await response.json();

  const selectedDay = data.availability?.[0];

  if (!selectedDay) {
    throw new Error(
      "No availability was returned for the selected date."
    );
  }

  return selectedDay;
}

export async function getAvailableDates(): Promise<
  { date: string; available: boolean }[]
> {
  const availability = await getAvailability();

  return availability.map((day) => ({
    date: day.date,
    available: day.slots.some((slot) => slot.available),
  }));
}