import { db } from "../../db/client";

import {
  findServiceById,
} from "../services/services.repository";

import {
  getAvailability,
} from "../availability/availability.service";

import type {
  CreateRequestInput,
} from "./requests.types";

export class RequestValidationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

function isWithinBookingWindow(dateValue: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateValue
  ) {
    return false;
  }

  const today = new Date();
  const todayStart = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const requestedStart = date.getTime();

  return (
    requestedStart >= todayStart &&
    requestedStart < todayStart + 7 * 24 * 60 * 60 * 1000
  );
}

export async function validateRequest(
  input: CreateRequestInput
): Promise<number | null> {
  if (
    input.fullName.trim().length < 2 ||
    input.location.trim().length < 2 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  ) {
    throw new RequestValidationError(
      "Check your name, email address, and service location.",
      400
    );
  }

  if (!isWithinBookingWindow(input.requestedDate)) {
    throw new RequestValidationError(
      "Choose an available appointment date.",
      400
    );
  }

  if (!["07:00", "11:00", "16:00"].includes(input.requestedTime)) {
    throw new RequestValidationError(
      "Choose an available appointment time.",
      400
    );
  }

  const availability = await getAvailability(
    input.requestedDate
  );

  const selectedSlot = availability[0]?.slots.find(
    (slot) => slot.time === input.requestedTime.slice(0, 5)
  );

  if (!selectedSlot?.available) {
    throw new RequestValidationError(
      "The selected time slot is no longer available.",
      409
    );
  }

  const service = await findServiceById(
    input.serviceId
  );

  if (!service) {
    throw new RequestValidationError(
      "The selected service does not exist or is inactive.",
      400
    );
  }

  if (input.issueId) {
    const issueResult = await db.query(
      `
        SELECT id
        FROM service_issues
        WHERE id = $1
          AND service_id = $2
        LIMIT 1
      `,
      [
        input.issueId,
        input.serviceId,
      ]
    );

    if (issueResult.rows.length === 0) {
      throw new RequestValidationError(
        "The selected issue does not belong to the selected service.",
        400
      );
    }
  }

  return service.basePrice;
}