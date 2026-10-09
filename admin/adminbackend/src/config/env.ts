import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4100),
  HOST: process.env.HOST ?? "0.0.0.0",
  DATABASE_URL: required("DATABASE_URL"),
  ADMIN_FRONTEND_URL:
    process.env.ADMIN_FRONTEND_URL ?? "http://localhost:5174",
};