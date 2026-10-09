import type { FastifyInstance } from "fastify";

import { notificationHub } from "./notificationHub.js";
import type { ServiceRequest } from "../requests/requests.types.js";

export async function realtimeRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/ws/requests",
    { websocket: true },
    (socket) => {
      notificationHub.add(socket);

      socket.send(
        JSON.stringify({
          type: "connected",
          message:
            "Admin realtime connection established.",
        }),
      );
    },
  );

  /**
   * Internal endpoint used by the main Techy application backend.
   *
   * The main backend calls this after a new request has
   * successfully been inserted into PostgreSQL.
   */
  app.post(
    "/api/internal/requests/created",
    async (request, reply) => {
      const body = request.body as {
        request?: ServiceRequest;
      };

      if (!body.request) {
        return reply.code(400).send({
          message: "Request payload is required.",
        });
      }

      notificationHub.broadcast({
        type: "request.created",
        request: body.request,
      });

      return reply.code(200).send({
        success: true,
      });
    },
  );
}