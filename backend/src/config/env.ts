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

  otpHmacSecret: process.env.OTP_HMAC_SECRET,

  africaTalkingUsername: process.env.AFRICASTALKING_USERNAME,

  africaTalkingApiKey: process.env.AFRICASTALKING_API_KEY,

  africaTalkingSenderId: process.env.AFRICASTALKING_SENDER_ID,

  africaTalkingEnvironment:
    process.env.AFRICASTALKING_ENVIRONMENT === "production"
      ? "production"
      : "sandbox",
};