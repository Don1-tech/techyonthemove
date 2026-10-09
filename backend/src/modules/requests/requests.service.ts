import { db } from "../../db/client";

import {
  findServiceById,
} from "../services/services.repository";

import {
  createRequest,
} from "./requests.repository";

import {
  generateRequestReference,
} from "./requestReference";

import {
  getAvailability,
} from "../availability/availability.service";

import {
  notifyAdminRequestCreated,
} from "../notifications/adminNotifier";

import type {
  CreateRequestInput,
  Request,
} from "./requests.types";

export async function submitRequest(
  input: CreateRequestInput
): Promise<Request> {
  const availability = await getAvailability(
    input.requestedDate
  );

  const selectedSlot = availability[0]?.slots.find(
    (slot) => slot.time === input.requestedTime.slice(0, 5)
  );

  if (!selectedSlot?.available) {
    throw new Error(
      "The selected time slot is no longer available."
    );
  }

  const service = await findServiceById(
    input.serviceId
  );

  if (!service) {
    throw new Error(
      "The selected service does not exist or is inactive."
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
      throw new Error(
        "The selected issue does not belong to the selected service."
      );
    }
  }

  const reference =
    generateRequestReference();

  const createdRequest = await createRequest(
    input,
    reference,
    service.basePrice
  );

  await notifyAdminRequestCreated(
    createdRequest
  );

  return createdRequest;
}