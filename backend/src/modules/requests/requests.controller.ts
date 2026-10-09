import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  submitRequest,
} from "./requests.service";

import type {
  CreateRequestInput,
} from "./requests.types";

export async function createRequestController(
  request: FastifyRequest<{
    Body: CreateRequestInput;
  }>,
  reply: FastifyReply
) {
  try {
    const createdRequest =
      await submitRequest(
        request.body
      );

    return reply.code(201).send({
      request: createdRequest,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create service request.";

    if (
      message ===
      "The selected service does not exist or is inactive."
    ) {
      return reply.badRequest(message);
    }

    if (
      message ===
      "The selected issue does not belong to the selected service."
    ) {
      return reply.badRequest(message);
    }

    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "23505"
    ) {
      return reply.conflict(
        "The selected time slot is no longer available."
      );
    }

    request.log.error(
      error,
      "Failed to create service request"
    );

    return reply.internalServerError(
      "Unable to create service request."
    );
  }
}
