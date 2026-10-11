import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { PoolClient } from "pg";

import { db } from "../../db/client";
import { env } from "../../config/env";
import { generateRequestReference } from "./requestReference";
import { createRequest } from "./requests.repository";
import { validateRequest } from "./requests.service";
import { normalizeKenyanPhone } from "./phoneNumbers";
import { sendSmsCode, SmsDeliveryError } from "./smsProvider";
import type { CreateRequestInput, Request } from "./requests.types";

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_DAILY_SMS = 5;
const MAX_NEW_CHALLENGES_PER_HOUR = 3;
const MAX_IP_SMS_PER_DAY = 20;
const MAX_IP_CHALLENGES_PER_HOUR = 10;
const MAX_GLOBAL_SMS_PER_DAY = 250;
const GLOBAL_SMS_LOCK = "request-verification-global-sms-limit";

export class VerificationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

interface ChallengeRow {
  id: string;
  pending_request: CreateRequestInput | null;
  phone_hash: string;
  ip_hash: string;
  otp_digest: string | null;
  expires_at: Date;
  next_resend_at: Date;
  attempt_count: number;
  resend_count: number;
  idempotency_key: string | null;
  status: "pending" | "completed" | "cancelled" | "expired";
  request_id: string | null;
}

export interface VerificationChallenge {
  verificationId: string;
  expiresAt: string;
  resendAt: string;
}

export interface ConfirmedRequest {
  reference: string;
  approximatePrice: number | null;
}

function getSecret(): string {
  const secret = env.otpHmacSecret;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new VerificationError(
      "Phone verification is not configured. Please try again later.",
      503
    );
  }
  return secret;
}

function digest(purpose: string, value: string): string {
  return createHmac("sha256", getSecret())
    .update(`${purpose}:${value}`)
    .digest("hex");
}

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function constantTimeDigestMatch(
  actualDigest: string | null,
  expectedDigest: string
): boolean {
  if (!actualDigest) {
    return false;
  }

  const actual = Buffer.from(actualDigest, "hex");
  const expected = Buffer.from(expectedDigest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function smsConfiguration() {
  const { africaTalkingUsername, africaTalkingApiKey } = env;
  if (!africaTalkingUsername || !africaTalkingApiKey) {
    throw new VerificationError(
      "Phone verification is not configured. Please try again later.",
      503
    );
  }

  return {
    username: africaTalkingUsername,
    apiKey: africaTalkingApiKey,
    senderId: env.africaTalkingSenderId,
  };
}

async function deliverCode(phone: string, code: string): Promise<void> {
  const configuration = smsConfiguration();
  try {
    await sendSmsCode(
      {
        username: configuration.username,
        apiKey: configuration.apiKey,
        senderId: configuration.senderId,
        environment:
          env.africaTalkingEnvironment === "sandbox"
            ? "sandbox"
            : "production",
      },
      phone,
      code
    );
  } catch (error) {
    if (error instanceof SmsDeliveryError) {
      throw new VerificationError(
        "We couldn't send a verification code. Please try again later.",
        502
      );
    }
    throw error;
  }
}

async function checkPhoneSpendingLimit(
  client: PoolClient,
  phoneHash: string,
  ipHash: string
): Promise<void> {
  const result = await client.query<{
    recent_challenges: string;
    daily_sms: string;
    ip_challenges: string;
    ip_sms: string;
    global_sms: string;
  }>(
    `
      SELECT
        (
          (SELECT COUNT(*) FROM request_verifications
           WHERE phone_hash = $1
             AND created_at >= NOW() - INTERVAL '1 hour')
          +
          (SELECT COUNT(*) FROM review_verifications
           WHERE phone_hash = $1
             AND created_at >= NOW() - INTERVAL '1 hour')
        )::text AS recent_challenges,
        (
          (SELECT COALESCE(SUM(1 + resend_count), 0)
           FROM request_verifications
           WHERE phone_hash = $1
             AND created_at >= NOW() - INTERVAL '24 hours')
          +
          (SELECT COUNT(*) FROM review_verifications
           WHERE phone_hash = $1 AND sms_attempted
             AND created_at >= NOW() - INTERVAL '24 hours')
        )::text AS daily_sms,
        (
          (SELECT COUNT(*) FROM request_verifications
           WHERE ip_hash = $2
             AND created_at >= NOW() - INTERVAL '1 hour')
          +
          (SELECT COUNT(*) FROM review_verifications
           WHERE ip_hash = $2
             AND created_at >= NOW() - INTERVAL '1 hour')
        )::text AS ip_challenges,
        (
          (SELECT COALESCE(SUM(1 + resend_count), 0)
           FROM request_verifications
           WHERE ip_hash = $2
             AND created_at >= NOW() - INTERVAL '24 hours')
          +
          (SELECT COUNT(*) FROM review_verifications
           WHERE ip_hash = $2 AND sms_attempted
             AND created_at >= NOW() - INTERVAL '24 hours')
        )::text AS ip_sms,
        (
          SELECT (
            (SELECT COALESCE(SUM(1 + resend_count), 0)
             FROM request_verifications
             WHERE created_at >= NOW() - INTERVAL '24 hours')
            +
            (SELECT COUNT(*)
             FROM review_verifications
             WHERE sms_attempted
               AND created_at >= NOW() - INTERVAL '24 hours')
          )::text
        ) AS global_sms
    `,
    [phoneHash, ipHash]
  );

  if (
    Number(result.rows[0].recent_challenges) >=
      MAX_NEW_CHALLENGES_PER_HOUR ||
    Number(result.rows[0].daily_sms) >= MAX_DAILY_SMS ||
    Number(result.rows[0].ip_challenges) >=
      MAX_IP_CHALLENGES_PER_HOUR ||
    Number(result.rows[0].ip_sms) >= MAX_IP_SMS_PER_DAY ||
    Number(result.rows[0].global_sms) >= MAX_GLOBAL_SMS_PER_DAY
  ) {
    throw new VerificationError(
      "Too many verification messages were requested. Please try again later.",
      429
    );
  }
}

function buildChallengeExpiry(): Date {
  return new Date(Date.now() + OTP_LIFETIME_MS);
}

export async function startRequestVerification(
  input: CreateRequestInput,
  sourceIp: string
): Promise<VerificationChallenge> {
  getSecret();
  smsConfiguration();

  const phone = normalizeKenyanPhone(input.phone);
  if (!phone) {
    throw new VerificationError("Enter a valid Kenyan phone number.", 400);
  }

  const normalizedInput: CreateRequestInput = {
    ...input,
    phone,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    location: input.location.trim(),
    issueDetails: input.issueDetails?.trim() ?? null,
    directions: input.directions?.trim() ?? null,
  };
  await validateRequest(normalizedInput);

  const verificationId = randomUUID();
  const phoneHash = digest("phone", phone);
  const ipHash = digest("ip", sourceIp);
  let code = "";
  let expiresAt = new Date();
  let resendAt = new Date();
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [phoneHash]
    );
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [ipHash]
    );
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [GLOBAL_SMS_LOCK]
    );
    await checkPhoneSpendingLimit(client, phoneHash, ipHash);
    const generatedAt = Date.now();
    code = generateOtp();
    expiresAt = new Date(generatedAt + OTP_LIFETIME_MS);
    resendAt = new Date(generatedAt + RESEND_COOLDOWN_MS);
    await client.query(
      `
        INSERT INTO request_verifications (
          id,
          pending_request,
          phone_hash,
          ip_hash,
          otp_digest,
          expires_at,
          next_resend_at
        )
        VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)
      `,
      [
        verificationId,
        JSON.stringify(normalizedInput),
        phoneHash,
        ipHash,
        digest("otp", `${verificationId}:${code}`),
        expiresAt,
        resendAt,
      ]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    await deliverCode(phone, code);
  } catch (error) {
    await db.query(
      `
        UPDATE request_verifications
        SET status = 'cancelled',
            pending_request = NULL,
            otp_digest = NULL
        WHERE id = $1
          AND status = 'pending'
      `,
      [verificationId]
    );
    throw error;
  }

  return {
    verificationId,
    expiresAt: expiresAt.toISOString(),
    resendAt: resendAt.toISOString(),
  };
}

async function lockChallenge(
  client: PoolClient,
  verificationId: string
): Promise<ChallengeRow | null> {
  const result = await client.query<ChallengeRow>(
    `
      SELECT
        id,
        pending_request,
        phone_hash,
        ip_hash,
        otp_digest,
        expires_at,
        next_resend_at,
        attempt_count,
        resend_count,
        idempotency_key,
        status,
        request_id
      FROM request_verifications
      WHERE id = $1
      FOR UPDATE
    `,
    [verificationId]
  );
  return result.rows[0] ?? null;
}

async function markExpired(
  client: PoolClient,
  verificationId: string
): Promise<void> {
  await client.query(
    `
      UPDATE request_verifications
      SET status = 'expired',
          pending_request = NULL,
          otp_digest = NULL
      WHERE id = $1
    `,
    [verificationId]
  );
}

export async function resendRequestVerification(
  verificationId: string
): Promise<VerificationChallenge> {
  getSecret();
  smsConfiguration();
  const client = await db.connect();
  let committed = false;
  let replacementCode = "";
  let resendPhone = "";
  let expiresAt = new Date();
  let resendAt = new Date();

  try {
    await client.query("BEGIN");
    const challenge = await lockChallenge(client, verificationId);
    if (!challenge || challenge.status !== "pending") {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }

    if (challenge.expires_at.getTime() <= Date.now()) {
      await markExpired(client, verificationId);
      await client.query("COMMIT");
      committed = true;
      throw new VerificationError(
        "This verification code has expired. Start your request again.",
        410
      );
    }

    if (challenge.next_resend_at.getTime() > Date.now()) {
      throw new VerificationError(
        "Please wait before requesting another code.",
        429
      );
    }

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext($1))",
      [GLOBAL_SMS_LOCK]
    );
    await checkPhoneSpendingLimit(
      client,
      challenge.phone_hash,
      challenge.ip_hash
    );
    if (!challenge.pending_request) {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }

    const phone = normalizeKenyanPhone(challenge.pending_request.phone);
    if (!phone) {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }
    resendPhone = phone;

    replacementCode = generateOtp();
    expiresAt = buildChallengeExpiry();
    resendAt = new Date(Date.now() + RESEND_COOLDOWN_MS);

    await client.query(
      `
        UPDATE request_verifications
        SET otp_digest = $2,
            expires_at = $3,
            next_resend_at = $4,
            attempt_count = 0,
            resend_count = resend_count + 1
        WHERE id = $1
      `,
      [
        verificationId,
        digest("otp", `${verificationId}:${replacementCode}`),
        expiresAt,
        resendAt,
      ]
    );
    await client.query("COMMIT");
    committed = true;
  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }

  try {
    await deliverCode(resendPhone, replacementCode);
  } catch (error) {
    await db.query(
      `
        UPDATE request_verifications
        SET status = 'cancelled',
            pending_request = NULL,
            otp_digest = NULL
        WHERE id = $1
          AND status = 'pending'
      `,
      [verificationId]
    );
    throw error;
  }

  return {
    verificationId,
    expiresAt: expiresAt.toISOString(),
    resendAt: resendAt.toISOString(),
  };
}

async function getConfirmedResult(
  client: PoolClient,
  requestId: string | null
): Promise<ConfirmedRequest> {
  if (!requestId) {
    throw new Error("Completed verification has no request reference.");
  }

  const result = await client.query<{
    reference: string;
    approximate_price: string | null;
  }>(
    `
      SELECT reference, approximate_price
      FROM requests
      WHERE id = $1
    `,
    [requestId]
  );
  const request = result.rows[0];
  if (!request) {
    throw new Error("Completed request could not be found.");
  }

  return {
    reference: request.reference,
    approximatePrice:
      request.approximate_price === null
        ? null
        : Number(request.approximate_price),
  };
}

export async function confirmRequestVerification(
  verificationId: string,
  code: string,
  idempotencyKey: string
): Promise<ConfirmedRequest> {
  getSecret();
  const client = await db.connect();
  let committed = false;
  let createdRequest: Request | null = null;

  try {
    await client.query("BEGIN");
    const challenge = await lockChallenge(client, verificationId);
    if (!challenge) {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }

    if (challenge.status === "completed") {
      if (challenge.idempotency_key !== idempotencyKey) {
        throw new VerificationError(
          "This verification code has already been used.",
          409
        );
      }
      const result = await getConfirmedResult(client, challenge.request_id);
      await client.query("COMMIT");
      committed = true;
      return result;
    }

    if (challenge.status !== "pending") {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }

    if (challenge.expires_at.getTime() <= Date.now()) {
      await markExpired(client, verificationId);
      await client.query("COMMIT");
      committed = true;
      throw new VerificationError(
        "This verification code has expired. Start your request again.",
        410
      );
    }

    if (challenge.attempt_count >= MAX_ATTEMPTS) {
      throw new VerificationError(
        "Too many incorrect codes. Start your request again.",
        429
      );
    }

    const matches = constantTimeDigestMatch(
      challenge.otp_digest,
      digest("otp", `${verificationId}:${code}`)
    );
    if (!matches) {
      const attempts = challenge.attempt_count + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await markExpired(client, verificationId);
      } else {
        await client.query(
          `
            UPDATE request_verifications
            SET attempt_count = $2
            WHERE id = $1
          `,
          [verificationId, attempts]
        );
      }
      await client.query("COMMIT");
      committed = true;
      throw new VerificationError(
        attempts >= MAX_ATTEMPTS
          ? "Too many incorrect codes. Start your request again."
          : "That code is incorrect. Please check it and try again.",
        attempts >= MAX_ATTEMPTS ? 429 : 400
      );
    }

    if (!challenge.pending_request) {
      throw new VerificationError(
        "This verification session is no longer available.",
        410
      );
    }

    const input = challenge.pending_request;
    const approximatePrice = await validateRequest(input);
    createdRequest = await createRequest(
      input,
      generateRequestReference(),
      approximatePrice,
      client
    );

    await client.query(
      `
        UPDATE request_verifications
        SET status = 'completed',
            pending_request = NULL,
            otp_digest = NULL,
            request_id = $2,
            idempotency_key = $3
        WHERE id = $1
      `,
      [verificationId, createdRequest.id, idempotencyKey]
    );
    await client.query("COMMIT");
    committed = true;
  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }

  if (!createdRequest) {
    throw new Error("Verified request creation did not return a request.");
  }

  return {
    reference: createdRequest.reference,
    approximatePrice: createdRequest.approximatePrice,
  };
}

export async function cancelRequestVerification(
  verificationId: string
): Promise<void> {
  await db.query(
    `
      UPDATE request_verifications
      SET status = 'cancelled',
          pending_request = NULL,
          otp_digest = NULL
      WHERE id = $1
        AND status = 'pending'
    `,
    [verificationId]
  );
}

export async function cleanExpiredRequestVerifications(): Promise<void> {
  await db.query(
    `
      UPDATE request_verifications
      SET status = 'expired',
          pending_request = NULL,
          otp_digest = NULL
      WHERE status = 'pending'
        AND expires_at <= NOW()
    `
  );
  await db.query(
    `
      DELETE FROM request_verifications
      WHERE created_at < NOW() - INTERVAL '24 hours'
        AND status <> 'pending'
    `
  );
}
