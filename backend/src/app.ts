import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import sensible from "@fastify/sensible";
import rateLimit from "@fastify/rate-limit";

import reviewsRoutes from "./modules/reviews/reviews.route";
import servicesRoutes from "./modules/services/services.route";
import availabilityRoutes from "./modules/availability/availability.route";
import requestsRoutes from "./modules/requests/requests.route";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(helmet);

  await app.register(cors, {
    origin: true,
  });

  await app.register(sensible);

  await app.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
  });

  await app.register(reviewsRoutes);
  await app.register(servicesRoutes);
  await app.register(availabilityRoutes);
  await app.register(requestsRoutes);

  return app;
}
