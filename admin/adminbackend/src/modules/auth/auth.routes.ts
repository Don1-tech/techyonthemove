import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";

import { env } from "../../config/env.js";

function safeCompare(
  first: string,
  second: string,
): boolean {
  const firstBuffer = Buffer.from(first, "utf8");
  const secondBuffer = Buffer.from(second, "utf8");

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/admin/auth/login", async (request, reply) => {
    const body = request.body as {
      username?: unknown;
      password?: unknown;
    } | null;

    if (
      !body ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return reply.code(400).send({
        message: "Username and password are required.",
      });
    }

    const validUsername = safeCompare(
      body.username,
      env.ADMIN_USERNAME,
    );

    const validPassword = safeCompare(
      body.password,
      env.ADMIN_PASSWORD,
    );

    if (!validUsername || !validPassword) {
      return reply.code(401).send({
        message: "Invalid username or password.",
      });
    }

    const token = app.jwt.sign(
      { sub: env.ADMIN_USERNAME },
      { expiresIn: "8h" },
    );

    return {
      token,
      expiresIn: 28800,
    };
  });
}