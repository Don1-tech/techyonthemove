import type { FastifyPluginAsync } from "fastify";

import {
  cancelRequestVerificationController,
  confirmRequestVerificationController,
  resendRequestVerificationController,
  startRequestVerificationController,
} from "./requests.controller";

import {
  createRequestBodySchema,
} from "./requests.schema";

const verificationIdSchema = {
  type: "object",
  required: ["verificationId"],
  additionalProperties: false,
  properties: {
    verificationId: { type: "string", format: "uuid" },
  },
} as const;

const verificationCodeSchema = {
  type: "object",
  required: ["verificationId", "code", "idempotencyKey"],
  additionalProperties: false,
  properties: {
    verificationId: { type: "string", format: "uuid" },
    code: { type: "string", pattern: "^\\d{6}$" },
    idempotencyKey: { type: "string", format: "uuid" },
  },
} as const;

const requestsRoutes: FastifyPluginAsync =
  async (app) => {
    app.post(
      "/api/requests",
      {
        schema: {
          body: createRequestBodySchema,
        },
        config: {
          rateLimit: {
            max: 3,
            timeWindow: "15 minutes",
          },
        },
      },
      startRequestVerificationController
    );

    app.post(
      "/api/requests/verification/verify",
      {
        schema: {
          body: verificationCodeSchema,
        },
        config: {
          rateLimit: {
            max: 10,
            timeWindow: "15 minutes",
          },
        },
      },
      confirmRequestVerificationController
    );

    app.post(
      "/api/requests/verification/resend",
      {
        schema: {
          body: verificationIdSchema,
        },
        config: {
          rateLimit: {
            max: 4,
            timeWindow: "15 minutes",
          },
        },
      },
      resendRequestVerificationController
    );

    app.post(
      "/api/requests/verification/cancel",
      {
        schema: {
          body: verificationIdSchema,
        },
        config: {
          rateLimit: {
            max: 10,
            timeWindow: "15 minutes",
          },
        },
      },
      cancelRequestVerificationController
    );
  };

export default requestsRoutes;
