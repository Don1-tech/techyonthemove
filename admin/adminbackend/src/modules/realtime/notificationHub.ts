import type { WebSocket } from "ws";

import type { ServiceRequest } from "../requests/requests.types.js";

export type AdminNotification =
  | {
      type: "connected";
      message: string;
    }
  | {
      type: "request.created";
      request: ServiceRequest;
    }
  | {
      type: "request.updated";
      request: ServiceRequest;
    };

class NotificationHub {
  private clients = new Set<WebSocket>();

  add(client: WebSocket) {
    this.clients.add(client);

    client.on("close", () => {
      this.clients.delete(client);
    });

    client.on("error", () => {
      this.clients.delete(client);
    });
  }

  broadcast(notification: AdminNotification) {
    const payload = JSON.stringify(notification);

    for (const client of this.clients) {
      if (client.readyState === 1) {
        client.send(payload);
      }
    }
  }

  size() {
    return this.clients.size;
  }
}

export const notificationHub =
  new NotificationHub();