import type { FastifyReply, FastifyRequest } from "fastify";

import {
  listReviews,
  submitReview,
  ReviewEligibilityError,
} from "./reviews.service";
import { SubmissionConflictError } from "../../db/submissionIdempotency";

import type { ReviewSubmissionInput } from "./reviews.types";
import { ReviewValidationError } from "./reviewValidation";
import { TurnstileError, verifyTurnstileToken } from "../../security/turnstile";

export async function createReviewController(
  request: FastifyRequest<{ Body: ReviewSubmissionInput }>,
  reply: FastifyReply
) {
  try {
    await verifyTurnstileToken(
      request.body.turnstileToken,
      "review_submit",
      request.log
    );
    const input = {
      customerName: request.body.customerName,
      serviceCategory: request.body.serviceCategory,
      rating: request.body.rating,
      reviewText: request.body.reviewText,
    };
    const { idempotencyKey } = request.body;
    const review = await submitReview(input, idempotencyKey);
    return reply.code(201).send(review);
  } catch (error) {
    if (error instanceof TurnstileError) {
      if (error.statusCode === 503) {
        request.log.error(
          { code: error.code },
          "Turnstile verification unavailable for review submission"
        );
      } else {
        request.log.warn(
          { code: error.code },
          "Review submission rejected by Turnstile"
        );
      }
      return reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
      });
    }
    if (error instanceof ReviewValidationError) {
      return reply.code(422).send({ message: error.message });
    }
    if (error instanceof SubmissionConflictError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    if (error instanceof ReviewEligibilityError) {
      request.log.info("Review submission name did not match a request");
      return reply.code(403).send({ message: error.message });
    }
    request.log.error(error, "Failed to submit review");
    return reply.internalServerError("Unable to submit review.");
  }
}

export async function getReviewsController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const reviews = await listReviews();

  return reply.send(reviews);
}