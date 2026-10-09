import type { FastifyPluginAsync } from "fastify";

import {
  getAvailabilityController,
} from "./availability.controller";

import {
  availabilityQuerySchema,
} from "./availability.schema";

const availabilityRoutes: FastifyPluginAsync =
  async (app) => {
    app.get(
      "/api/availability",
      {
        schema: {
          querystring:
            availabilityQuerySchema,
        },
      },
      getAvailabilityController
    );
  };

export default availabilityRoutes;