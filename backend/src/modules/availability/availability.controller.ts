import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";

import {
  getAvailability,
} from "./availability.service";

interface AvailabilityQuery {
  date?: string;
}

export async function getAvailabilityController(
  request: FastifyRequest<{
    Querystring: AvailabilityQuery;
  }>,
  reply: FastifyReply
) {
  const availability =
    await getAvailability(
      request.query.date
    );

  return reply.send({
    availability,
  });
}