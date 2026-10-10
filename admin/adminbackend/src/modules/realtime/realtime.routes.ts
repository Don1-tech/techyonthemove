import type { FastifyInstance } from "fastify";

import { env } from "../../config/env.js";
import { notificationHub } from "./notificationHub.js";

export async function realtimeRoutes(
  app: FastifyInstance,
) {
  app.get(
    "/ws/requests",
    { websocket: true },
    (socket) => {
      let authenticated = false;

      // Close unauthenticated connections if they do not
      // provide a token promptly.
      const authTimeout = setTimeout(() => {
        if (!authenticated) {
          socket.close(1008, "Authentication required");
        }
      }, 5000);

      socket.once("message", (rawMessage) => {
        clearTimeout(authTimeout);

        try {
          const message = JSON.parse(rawMessage.toString()) as {
            type?: string;
            token?: string;
          };

          if (
            message.type !== "authenticate" ||
            typeof message.token !== "string" ||
            message.token.length === 0
          ) {
            socket.close(1008, "Invalid authentication message");
            return;
          }

          const user = app.jwt.verify<{ sub?: string }>(
            message.token,
          );

          if (user.sub !== env.ADMIN_USERNAME) {
            socket.close(1008, "Unauthorized");
            return;
          }

          authenticated = true;
          notificationHub.add(socket);

          socket.send(
            JSON.stringify({
              type: "connected",
              message: "Admin realtime connection established.",
            }),
          );
        } catch {
          socket.close(1008, "Invalid or expired token");
        }
      });

      socket.on("close", () => {
        clearTimeout(authTimeout);
      });
    },
  );
}