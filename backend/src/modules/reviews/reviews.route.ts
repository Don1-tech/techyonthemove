import type { FastifyInstance } from "fastify";

import {
  createReviewController,
  getReviewsController,
  verifyReviewController,
} from "./reviews.controller";

import {
  createReviewSchema,
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
              additionalProperties: false,
              required: [
                "id",
                "customerName",
                "serviceCategory",
                "rating",
                "reviewText",
                "createdAt",
              ],
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
      config: {
        rateLimit: {
          max: 3,
          timeWindow: "15 minutes",
        },
      },
    },
    createReviewController
  );

  fastify.post(
    "/api/reviews/verification/verify",
    {
      schema: {
        body: {
          type: "object",
          required: ["verificationId", "code"],
          additionalProperties: false,
          properties: {
            verificationId: { type: "string", format: "uuid" },
            code: { type: "string", pattern: "^[0-9]{6}$" },
          },
        },
      },
      config: {
        rateLimit: {
          max: 15,
          timeWindow: "1 minute",
        },
      },
    },
    verifyReviewController
  );
}