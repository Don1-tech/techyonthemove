import type { FastifyInstance } from "fastify";

import {
  changeRequestStatus,
  getRequestById,
  getRequests,
} from "./requests.service.js";

import type { RequestStatus } from "./requests.types.js";
import { env } from "../../config/env.js";

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
  app.addHook("preHandler", async (request, reply) => {
    try {
      await request.jwtVerify();

      const user = request.user as { sub?: string };

      if (user.sub !== env.ADMIN_USERNAME) {
        return reply.code(401).send({
          message: "Admin authentication required.",
        });
      }
    } catch {
      return reply.code(401).send({
        message: "Your session is invalid or expired. Please log in again.",
      });
    }
  });

  app.get("/api/admin/requests", async (request, reply) => {
    const query = request.query as {
      status?: string;
      search?: string;
    };

    if (query.status && !isRequestStatus(query.status)) {
      return reply.code(400).send({
        message:
          "Invalid status. Use pending, confirmed, completed, or cancelled.",
      });
    }

    const requests = await getRequests(
      query.status as RequestStatus | undefined,
      query.search,
    );

    return { requests };
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

      return { request: found };
    },
  );

  app.patch(
    "/api/admin/requests/:id/status",
    async (request, reply) => {
      const params = request.params as { id: string };
      const body = request.body as { status?: string } | null;

      if (!body?.status || !isRequestStatus(body.status)) {
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

      // PostgreSQL's trigger publishes the status change.
      // Do not broadcast it here as well, or notifications duplicate.

      return { request: result.request };
    },
  );
}