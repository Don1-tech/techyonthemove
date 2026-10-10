import "dotenv/config";

function required(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

const jwtSecret = required("JWT_SECRET");

if (Buffer.byteLength(jwtSecret, "utf8") < 32) {
  throw new Error(
    "JWT_SECRET must contain at least 32 bytes.",
  );
}

export const env = {
  PORT: Number(process.env.PORT ?? 4100),
  HOST: process.env.HOST ?? "0.0.0.0",

  DATABASE_URL: required("DATABASE_URL"),

  DATABASE_DIRECT_URL:
    process.env.DATABASE_DIRECT_URL?.trim() || undefined,

  ADMIN_FRONTEND_URL:
    process.env.ADMIN_FRONTEND_URL ??
    "http://localhost:5174",

  ADMIN_USERNAME: required("ADMIN_USERNAME"),
  ADMIN_PASSWORD: required("ADMIN_PASSWORD"),
  JWT_SECRET: jwtSecret,
};