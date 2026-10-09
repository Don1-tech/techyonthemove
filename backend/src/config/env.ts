import "dotenv/config";

const requiredEnv = [
  "DATABASE_URL",
  "BUSINESS_EMAIL",
] as const;

for (const name of requiredEnv) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",

  port: Number(process.env.PORT ?? 4000),

  host: process.env.HOST ?? "0.0.0.0",

  databaseUrl: process.env.DATABASE_URL!,

  businessEmail: process.env.BUSINESS_EMAIL!,
};