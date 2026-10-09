
import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import websocket from "@fastify/websocket";

import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { requestsRoutes } from "./modules/requests/requests.routes.js";
import { realtimeRoutes } from "./modules/realtime/realtime.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.register(cors, {
    origin: env.ADMIN_FRONTEND_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],
  });

  app.register(helmet);

  app.register(websocket);

  app.get("/health", async () => {
    return {
      status: "ok",
      service: "techy-on-the-move-admin-backend",
    };
  });

  app.get("/health/database", async () => {
    await checkDatabaseConnection();

    return {
      status: "ok",
      database: "connected",
    };
  });

  app.register(requestsRoutes);
  app.register(realtimeRoutes);

  return app;
}
