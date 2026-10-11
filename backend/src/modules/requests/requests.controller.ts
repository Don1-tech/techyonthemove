import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  RequestValidationError,
  submitServiceRequest,
} from "./requests.service";
import type { CreateRequestInput } from "./requests.types";
import { TurnstileError, verifyTurnstileToken } from "../../security/turnstile";
import { SubmissionConflictError } from "../../db/submissionIdempotency";

interface CreateRequestBody extends CreateRequestInput {
  turnstileToken: string;
  idempotencyKey: string;
}

function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  genericMessage: string
) {
  if (error instanceof TurnstileError) {
    if (error.statusCode === 503) {
      request.log.error(
        { code: error.code },
        "Turnstile verification unavailable for request submission"
      );
    } else {
      request.log.warn(
        { code: error.code },
        "Request submission rejected by Turnstile"
      );
    }
    return reply.code(error.statusCode).send({
      code: error.code,
      message: error.message,
    });
  }

  if (error instanceof RequestValidationError) {
    return reply.code(error.statusCode).send({
      message: error.message,
    });
  }

  if (error instanceof SubmissionConflictError) {
    return reply.code(error.statusCode).send({ message: error.message });
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

  request.log.error(error, genericMessage);
  return reply.internalServerError(genericMessage);
}

export async function createRequestController(
  request: FastifyRequest<{ Body: CreateRequestBody }>,
  reply: FastifyReply
) {
  try {
    await verifyTurnstileToken(
      request.body.turnstileToken,
      "request_create",
      request.log
    );
    const {
      serviceId,
      issueId,
      issueDetails,
      fullName,
      phone,
      email,
      location,
      directions,
      requestedDate,
      requestedTime,
      idempotencyKey,
    } = request.body;
    const input: CreateRequestInput = {
      serviceId,
      issueId,
      issueDetails,
      fullName,
      phone,
      email,
      location,
      directions,
      requestedDate,
      requestedTime,
    };
    const result = await submitServiceRequest(input, idempotencyKey);
    return reply.code(201).send({ request: result });
  } catch (error) {
    return sendError(
      request,
      reply,
      error,
      "Unable to submit your service request."
    );
  }
}
