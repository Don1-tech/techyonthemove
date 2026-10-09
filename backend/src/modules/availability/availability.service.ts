import {
  findBookedSlots,
} from "./availability.repository";

import type {
  AvailabilityDay,
  AvailabilitySlot,
} from "./availability.types";

const BOOKING_SLOTS = [
  "09:00",
  "11:00",
  "13:00",
  "15:00",
  "17:00",
];

const BOOKING_WINDOW_DAYS = 7;

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function getAvailability(
  requestedDate?: string
): Promise<AvailabilityDay[]> {
  const today = new Date();

  if (requestedDate) {
    const bookedSlots = await findBookedSlots(
      requestedDate,
      requestedDate
    );

    const bookedTimes = new Set(
      bookedSlots.map(
        (slot) => slot.requested_time
      )
    );

    const slots: AvailabilitySlot[] =
      BOOKING_SLOTS.map((time) => ({
        time,
        available: !bookedTimes.has(time),
      }));

    return [
      {
        date: requestedDate,
        slots,
      },
    ];
  }

  const startDate = formatDate(today);
  const endDate = formatDate(
    addDays(today, BOOKING_WINDOW_DAYS - 1)
  );

  const bookedSlots = await findBookedSlots(
    startDate,
    endDate
  );

  const booked = new Set(
    bookedSlots.map(
      (slot) =>
        `${slot.requested_date}|${slot.requested_time}`
    )
  );

  const availability: AvailabilityDay[] = [];

  for (
    let offset = 0;
    offset < BOOKING_WINDOW_DAYS;
    offset++
  ) {
    const date = formatDate(
      addDays(today, offset)
    );

    const slots: AvailabilitySlot[] =
      BOOKING_SLOTS.map((time) => ({
        time,
        available: !booked.has(
          `${date}|${time}`
        ),
      }));

    availability.push({
      date,
      slots,
    });
  }

  return availability;
}