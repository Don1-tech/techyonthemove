import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import websocket from "@fastify/websocket";
import jwt from "@fastify/jwt";

import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { requestsRoutes } from "./modules/requests/requests.routes.js";
import { realtimeRoutes } from "./modules/realtime/realtime.routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1024 * 1024,
  });

  app.register(cors, {
    origin: env.ADMIN_FRONTEND_URL,
    credentials: false,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.register(helmet);

  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.register(websocket);

  app.get("/health", async () => ({
    status: "ok",
    service: "techy-on-the-move-admin-backend",
  }));

  app.get("/health/database", async (_request, reply) => {
    try {
      await checkDatabaseConnection();

      return {
        status: "ok",
        database: "connected",
      };
    } catch {
      return reply.code(503).send({
        status: "error",
        database: "unavailable",
      });
    }
  });

  app.register(authRoutes);
  app.register(requestsRoutes);
  app.register(realtimeRoutes);

  return app;
}