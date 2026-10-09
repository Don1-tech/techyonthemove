import type { FastifyReply, FastifyRequest } from "fastify";

import {
  deleteReviewById,
  listReviews,
  submitReview,
} from "./reviews.service";

import type { CreateReviewInput } from "./reviews.types";

interface ReviewIdParams {
  id: string;
}

export async function createReviewController(
  request: FastifyRequest<{ Body: CreateReviewInput }>,
  reply: FastifyReply
) {
  const review = await submitReview(request.body);

  return reply.code(201).send(review);
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