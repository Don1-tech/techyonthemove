import type { FastifyReply, FastifyRequest } from "fastify";

import {
  getServiceById,
  getServices,
} from "./services.service";

export async function getServicesController(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const services = await getServices();

  return reply.send({
    services,
  });
}

export async function getServiceByIdController(
  request: FastifyRequest<{
    Params: {
      id: string;
    };
  }>,
  reply: FastifyReply
) {
  const service = await getServiceById(
    request.params.id
  );

  if (!service) {
    return reply.notFound("Service not found.");
  }

  return reply.send({
    service,
  });
}