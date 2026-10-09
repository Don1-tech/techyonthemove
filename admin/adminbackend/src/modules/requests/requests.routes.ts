import type { FastifyInstance } from "fastify";

import {
  changeRequestStatus,
  getRequestById,
  getRequests,
} from "./requests.service.js";
import type {
  RequestStatus,
} from "./requests.types.js";
import { notificationHub } from "../realtime/notificationHub.js";

const statuses: RequestStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

function isRequestStatus(
  value: string | undefined,
): value is RequestStatus {
  return Boolean(
    value && statuses.includes(value as RequestStatus),
  );
}

export async function requestsRoutes(
  app: FastifyInstance,
) {
  app.get("/api/admin/requests", async (request, reply) => {
    const query = request.query as {
      status?: string;
      search?: string;
    };

    if (
      query.status &&
      !isRequestStatus(query.status)
    ) {
      return reply.code(400).send({
        message:
          "Invalid status. Use pending, confirmed, completed, or cancelled.",
      });
    }

    const requests = await getRequests(
      query.status as RequestStatus | undefined,
      query.search,
    );

    return {
      requests,
    };
  });

  app.get(
    "/api/admin/requests/:id",
    async (request, reply) => {
      const params = request.params as { id: string };

      const found = await getRequestById(params.id);

      if (!found) {
        return reply.code(404).send({
          message: "Request not found.",
        });
      }

      return {
        request: found,
      };
    },
  );

  app.patch(
    "/api/admin/requests/:id/status",
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as {
        status?: string;
      };

      if (
        !body.status ||
        !isRequestStatus(body.status)
      ) {
        return reply.code(400).send({
          message:
            "Invalid status. Use pending, confirmed, completed, or cancelled.",
        });
      }

      const result = await changeRequestStatus(
        params.id,
        body.status,
      );

      if (result.error === "NOT_FOUND") {
        return reply.code(404).send({
          message: "Request not found.",
        });
      }

      if (result.error === "INVALID_TRANSITION") {
        return reply.code(409).send({
          message: "That request status transition is not allowed.",
        });
      }

      if (!result.request) {
        return reply.code(500).send({
          message: "Request status could not be updated.",
        });
      }

      notificationHub.broadcast({
        type: "request.updated",
        request: result.request,
      });

      return {
        request: result.request,
      };
    },
  );
}