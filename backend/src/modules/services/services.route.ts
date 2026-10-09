import type { FastifyPluginAsync } from "fastify";

import {
  getServiceByIdController,
  getServicesController,
} from "./services.controller";

import {
  serviceIdParamsSchema,
} from "./services.schema";

const servicesRoutes: FastifyPluginAsync =
  async (app) => {
    app.get(
      "/api/services",
      getServicesController
    );

    app.get(
      "/api/services/:id",
      {
        schema: {
          params: serviceIdParamsSchema,
        },
      },
      getServiceByIdController
    );
  };

export default servicesRoutes;