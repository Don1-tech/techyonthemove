import type { FastifyReply, FastifyRequest } from "fastify";

import {
  deleteReviewById,
  listReviews,
  startReviewVerification,
  confirmReviewVerification,
  ReviewVerificationError,
} from "./reviews.service";

import type { CreateReviewInput } from "./reviews.types";
import { ReviewValidationError } from "./reviewValidation";

interface ReviewIdParams {
  id: string;
}

export async function createReviewController(
  request: FastifyRequest<{ Body: CreateReviewInput }>,
  reply: FastifyReply
) {
  try {
    const challenge = await startReviewVerification(
      request.body,
      request.ip,
      request.log
    );
    return reply.code(202).send(challenge);
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return reply.code(400).send({ message: error.message });
    }
    if (error instanceof ReviewVerificationError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }

    request.log.error(error, "Failed to submit review");
    return reply.internalServerError("Unable to start review verification.");
  }
}

interface VerifyReviewBody {
  verificationId: string;
  code: string;
}

export async function verifyReviewController(
  request: FastifyRequest<{ Body: VerifyReviewBody }>,
  reply: FastifyReply
) {
  try {
    const review = await confirmReviewVerification(
      request.body.verificationId,
      request.body.code
    );
    return reply.code(201).send(review);
  } catch (error) {
    if (error instanceof ReviewVerificationError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    request.log.error(error, "Failed to verify review submission");
    return reply.internalServerError("Unable to verify review submission.");
  }
}

export async function getReviewsController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const reviews = await listReviews();

  return reply.send(reviews);
}

export async function deleteReviewController(
  request: FastifyRequest<{ Params: ReviewIdParams }>,
  reply: FastifyReply
) {
  const review = await deleteReviewById(request.params.id);

  if (!review) {
    return reply.code(404).send({
      message: "Review not found",
    });
  }

  return reply.send(review);
}