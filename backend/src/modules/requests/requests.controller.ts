import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  cancelRequestVerification,
  confirmRequestVerification,
  VerificationError,
  resendRequestVerification,
  startRequestVerification,
} from "./requestVerification.service";
import { RequestValidationError } from "./requests.service";
import type { CreateRequestInput } from "./requests.types";

interface VerificationIdBody {
  verificationId: string;
}

interface VerifyBody extends VerificationIdBody {
  code: string;
  idempotencyKey: string;
}

function sendError(
  request: FastifyRequest,
  reply: FastifyReply,
  error: unknown,
  genericMessage: string
) {
  if (
    error instanceof VerificationError ||
    error instanceof RequestValidationError
  ) {
    return reply.code(error.statusCode).send({
      message: error.message,
    });
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

export async function startRequestVerificationController(
  request: FastifyRequest<{ Body: CreateRequestInput }>,
  reply: FastifyReply
) {
  try {
    const verification = await startRequestVerification(
      request.body,
      request.ip
    );
    return reply.code(202).send({ verification });
  } catch (error) {
    return sendError(
      request,
      reply,
      error,
      "Unable to start phone verification."
    );
  }
}

export async function confirmRequestVerificationController(
  request: FastifyRequest<{
    Body: VerifyBody;
  }>,
  reply: FastifyReply
) {
  try {
    const result = await confirmRequestVerification(
      request.body.verificationId,
      request.body.code,
      request.body.idempotencyKey
    );
    return reply.send({ request: result });
  } catch (error) {
    return sendError(
      request,
      reply,
      error,
      "Unable to verify your phone number."
    );
  }
}

export async function resendRequestVerificationController(
  request: FastifyRequest<{ Body: VerificationIdBody }>,
  reply: FastifyReply
) {
  try {
    const verification = await resendRequestVerification(
      request.body.verificationId
    );
    return reply.send({ verification });
  } catch (error) {
    return sendError(
      request,
      reply,
      error,
      "Unable to resend the verification code."
    );
  }
}

export async function cancelRequestVerificationController(
  request: FastifyRequest<{ Body: VerificationIdBody }>,
  reply: FastifyReply
) {
  try {
    await cancelRequestVerification(request.body.verificationId);
    return reply.send({ cancelled: true });
  } catch (error) {
    return sendError(
      request,
      reply,
      error,
      "Unable to cancel phone verification."
    );
  }
}
