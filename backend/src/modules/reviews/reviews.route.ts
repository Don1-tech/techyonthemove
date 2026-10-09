import type { FastifyInstance } from "fastify";

import {
  createReviewController,
  deleteReviewController,
  getReviewsController,
} from "./reviews.controller";

import {
  createReviewSchema,
  reviewIdSchema,
} from "./reviews.schema";

export default async function reviewsRoutes(
  fastify: FastifyInstance
) {
  fastify.get(
    "/api/reviews",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                customerName: { type: "string" },
                serviceCategory: { type: "string" },
                rating: { type: "integer" },
                reviewText: { type: "string" },
                createdAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    getReviewsController
  );

  fastify.post(
    "/api/reviews",
    {
      schema: createReviewSchema,
    },
    createReviewController
  );

  fastify.delete(
    "/api/reviews/:id",
    {
      schema: reviewIdSchema,
    },
    deleteReviewController
  );
}