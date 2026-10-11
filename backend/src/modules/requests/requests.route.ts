import type { FastifyPluginAsync } from "fastify";

import {
  createRequestController,
} from "./requests.controller";

import {
  createRequestBodySchema,
} from "./requests.schema";

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
      createRequestController
    );
  };

export default requestsRoutes;
