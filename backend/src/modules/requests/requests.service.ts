import {
  hashSubmissionPayload,
  lockSubmissionKey,
  removeExpiredSubmissionKeys,
  SubmissionConflictError,
} from "../../db/submissionIdempotency";
import { db } from "../../db/client";
import { generateRequestReference } from "./requestReference";
import { createRequest } from "./requests.repository";
import { normalizeKenyanPhone } from "./phoneNumbers";

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

export interface CreatedRequestReceipt {
  reference: string;
  approximatePrice: number | null;
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

  if (!normalizeKenyanPhone(input.phone)) {
    throw new RequestValidationError(
      "Enter a valid Kenyan phone number.",
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

export async function submitServiceRequest(
  input: CreateRequestInput,
  idempotencyKey: string
): Promise<CreatedRequestReceipt> {
  const phone = normalizeKenyanPhone(input.phone);
  if (!phone) {
    throw new RequestValidationError(
      "Enter a valid Kenyan phone number.",
      400
    );
  }

  const normalizedInput: CreateRequestInput = {
    ...input,
    fullName: input.fullName.trim().replace(/\s+/g, " "),
    phone,
    email: input.email.trim(),
    location: input.location.trim(),
    directions: input.directions?.trim() ?? null,
    issueDetails: input.issueDetails?.trim() ?? null,
  };
  const payloadHash = hashSubmissionPayload("request", normalizedInput);
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await lockSubmissionKey(client, idempotencyKey);
    await removeExpiredSubmissionKeys(client);

    const existingResult = await client.query<{
      payload_hash: string;
      request_id: string | null;
      review_id: string | null;
      reference: string | null;
      approximate_price: string | null;
    }>(
      `
        SELECT
          submission_idempotency.payload_hash,
          submission_idempotency.request_id,
          submission_idempotency.review_id,
          requests.reference,
          requests.approximate_price
        FROM submission_idempotency
        LEFT JOIN requests
          ON requests.id = submission_idempotency.request_id
        WHERE submission_idempotency.idempotency_key = $1
        FOR UPDATE OF submission_idempotency
      `,
      [idempotencyKey]
    );
    const existing = existingResult.rows[0];
    if (existing) {
      if (
        existing.payload_hash !== payloadHash ||
        !existing.request_id ||
        existing.review_id ||
        !existing.reference
      ) {
        throw new SubmissionConflictError();
      }

      await client.query("COMMIT");
      return {
        reference: existing.reference,
        approximatePrice:
          existing.approximate_price === null
            ? null
            : Number(existing.approximate_price),
      };
    }

    const approximatePrice = await validateRequest(normalizedInput);
    const request = await createRequest(
      normalizedInput,
      generateRequestReference(),
      approximatePrice,
      client
    );
    await client.query(
      `
        INSERT INTO submission_idempotency (
          idempotency_key, payload_hash, request_id
        )
        VALUES ($1, $2, $3)
      `,
      [idempotencyKey, payloadHash, request.id]
    );
    await client.query("COMMIT");

    return {
      reference: request.reference,
      approximatePrice: request.approximatePrice,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}