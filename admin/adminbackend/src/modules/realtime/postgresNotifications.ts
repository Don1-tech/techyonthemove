import pg from "pg";

import { env } from "../../config/env.js";
import { notificationHub } from "./notificationHub.js";
import type { ServiceRequest } from "../requests/requests.types.js";

const { Client } = pg;

interface RequestNotificationPayload {
  event: "created" | "updated";
  request: ServiceRequest;
}

let listener: pg.Client | null = null;

export async function startPostgresNotifications(): Promise<void> {
  if (listener) {
    return;
  }

  const client = new Client({
    connectionString:
      env.DATABASE_DIRECT_URL ?? env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });

  try {
    await client.connect();
    await client.query("LISTEN techy_requests");

    client.on("notification", (message) => {
      if (!message.payload) {
        return;
      }

      try {
        const payload = JSON.parse(
          message.payload,
        ) as RequestNotificationPayload;

        if (!payload.request || !payload.event) {
          return;
        }

        if (payload.event === "created") {
          notificationHub.broadcast({
            type: "request.created",
            request: payload.request,
          });
        } else if (payload.event === "updated") {
          notificationHub.broadcast({
            type: "request.updated",
            request: payload.request,
          });
        }
      } catch (error) {
        console.error(
          "Could not process PostgreSQL notification:",
          error,
        );
      }
    });

    client.on("error", (error) => {
      console.error(
        "PostgreSQL notification listener error:",
        error,
      );
    });

    listener = client;

    console.log(
      "PostgreSQL realtime listener is listening on techy_requests.",
    );
  } catch (error) {
    await client.end().catch(() => undefined);
    throw error;
  }
}

export async function stopPostgresNotifications(): Promise<void> {
  const client = listener;

  if (!client) {
    return;
  }

  listener = null;

  try {
    await client.query("UNLISTEN techy_requests");
  } catch {
    // The connection may already be closed.
  }

  await client.end().catch(() => undefined);
}