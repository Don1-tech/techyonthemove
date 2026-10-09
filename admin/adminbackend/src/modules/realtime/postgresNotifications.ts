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

export async function startPostgresNotifications() {
  listener = new Client({
    connectionString: env.DATABASE_URL,
  });

  await listener.connect();
  await listener.query("LISTEN techy_requests");

  listener.on("notification", (message) => {
    if (!message.payload) {
      return;
    }

    try {
      const payload =
        JSON.parse(message.payload) as RequestNotificationPayload;

      if (payload.event === "created") {
        notificationHub.broadcast({
          type: "request.created",
          request: payload.request,
        });
      }

      if (payload.event === "updated") {
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

  listener.on("error", (error) => {
    console.error(
      "PostgreSQL notification listener error:",
      error,
    );
  });

  console.log(
    "PostgreSQL realtime listener is listening on techy_requests.",
  );
}

export async function stopPostgresNotifications() {
  if (!listener) {
    return;
  }

  try {
    await listener.query("UNLISTEN techy_requests");
    await listener.end();
  } finally {
    listener = null;
  }
}