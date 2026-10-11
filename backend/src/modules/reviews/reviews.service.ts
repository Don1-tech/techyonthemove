import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { FastifyBaseLogger } from "fastify";
import type { PoolClient } from "pg";
import { db } from "../../db/client";
import { env } from "../../config/env";
import { normalizeKenyanPhone } from "../requests/phoneNumbers";
import { sendSmsCode, SmsDeliveryError } from "../requests/smsProvider";
import {
  createReview,
  deleteReview,
  getAllReviews,
} from "./reviews.repository";

import type { CreateReviewInput, Review } from "./reviews.types";
import {
  ReviewValidationError,
  normalizeCustomerName,
  validateReviewSubmission,
} from "./reviewValidation";
import { findMatchingRequestCustomer } from "./reviews.repository";

const REVIEW_OTP_LIFETIME_MS = 10 * 60 * 1000;
const REVIEW_MAX_ATTEMPTS = 5;
const REVIEW_MAX_PHONE_SMS_PER_DAY = 5;
const REVIEW_MAX_PHONE_CHALLENGES_PER_HOUR = 3;
const REVIEW_MAX_IP_SMS_PER_DAY = 20;
const REVIEW_MAX_IP_CHALLENGES_PER_HOUR = 10;
const REVIEW_MAX_GLOBAL_SMS_PER_DAY = 250;
const REVIEW_SMS_LOCK = "request-verification-global-sms-limit";

export class ReviewVerificationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
  }
}

export interface ReviewChallenge {
  verificationId: string;
  expiresAt: string;
}

interface ReviewChallengeRow {
  id: string;
  pending_review: CreateReviewInput | null;
  phone_hash: string;
  ip_hash: string;
  otp_digest: string | null;
  expires_at: Date;
  attempt_count: number;
  status: "pending" | "completed" | "cancelled" | "expired";
  review_id: string | null;
}

function reviewSecret(): string {
  const secret = env.otpHmacSecret;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new ReviewVerificationError(
      "Phone verification is not configured. Please try again later.",
      503
    );
  }
  return secret;
}

function reviewDigest(purpose: string, value: string): string {
  return createHmac("sha256", reviewSecret())
    .update(`${purpose}:${value}`)
    .digest("hex");
}

function makeReviewOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function matchesDigest(actualDigest: string | null, expectedDigest: string) {
  if (!actualDigest) {
    return false;
  }
  const actual = Buffer.from(actualDigest, "hex");
  const expected = Buffer.from(expectedDigest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function validateReviewInput(input: CreateReviewInput): string {
  if (input.serviceCategory.trim().length < 2) {
    throw new ReviewValidationError("Select a service category.");
  }

  const validationError = validateReviewSubmission(
    input.customerName,
    input.reviewText
  );

  if (validationError) {
    throw new ReviewValidationError(validationError);
  }

  const phone = normalizeKenyanPhone(input.phone);
  if (!phone) {
    throw new ReviewValidationError("Enter a valid Kenyan phone number.");
  }

  return phone;
}

async function validateReviewLimits(
  client: PoolClient,
  phoneHash: string,
  ipHash: string
): Promise<void> {
  const result = await client.query<{
    phone_challenges: string;
    phone_sms: string;
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
        )::text AS phone_challenges,
        (
          (SELECT COALESCE(SUM(1 + resend_count), 0)
           FROM request_verifications
           WHERE phone_hash = $1
             AND created_at >= NOW() - INTERVAL '24 hours')
          +
          (SELECT COUNT(*) FROM review_verifications
           WHERE phone_hash = $1 AND sms_attempted
             AND created_at >= NOW() - INTERVAL '24 hours')
        )::text AS phone_sms,
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
  const limits = result.rows[0];
  if (
    Number(limits.phone_challenges) >= REVIEW_MAX_PHONE_CHALLENGES_PER_HOUR ||
    Number(limits.phone_sms) >= REVIEW_MAX_PHONE_SMS_PER_DAY ||
    Number(limits.ip_challenges) >= REVIEW_MAX_IP_CHALLENGES_PER_HOUR ||
    Number(limits.ip_sms) >= REVIEW_MAX_IP_SMS_PER_DAY ||
    Number(limits.global_sms) >= REVIEW_MAX_GLOBAL_SMS_PER_DAY
  ) {
    throw new ReviewVerificationError(
      "Too many verification messages were requested. Please try again later.",
      429
    );
  }
}

async function sendReviewOtp(phone: string, code: string): Promise<void> {
  const { africaTalkingUsername, africaTalkingApiKey } = env;
  if (!africaTalkingUsername || !africaTalkingApiKey) {
    throw new ReviewVerificationError(
      "Phone verification is not configured. Please try again later.",
      503
    );
  }
  try {
    await sendSmsCode(
      {
        username: africaTalkingUsername,
        apiKey: africaTalkingApiKey,
        senderId: env.africaTalkingSenderId,
        environment:
          env.africaTalkingEnvironment === "sandbox" ? "sandbox" : "production",
      },
      phone,
      code
    );
  } catch (error) {
    if (error instanceof SmsDeliveryError) {
      throw new ReviewVerificationError(
        "We couldn't send a verification code. Please try again later.",
        502
      );
    }
    throw error;
  }
}

export async function startReviewVerification(
  input: CreateReviewInput,
  sourceIp: string,
  logger: FastifyBaseLogger
): Promise<ReviewChallenge> {
  const phone = validateReviewInput(input);
  reviewSecret();
  if (!env.africaTalkingUsername || !env.africaTalkingApiKey) {
    throw new ReviewVerificationError(
      "Phone verification is not configured. Please try again later.",
      503
    );
  }
  const verificationId = randomUUID();
  const expiresAt = new Date(Date.now() + REVIEW_OTP_LIFETIME_MS);
  const normalizedInput: CreateReviewInput = {
    ...input,
    customerName: input.customerName.trim(),
    phone,
    serviceCategory: input.serviceCategory.trim(),
    reviewText: input.reviewText.trim(),
  };
  const phoneHash = reviewDigest("phone", phone);
  const ipHash = reviewDigest("ip", sourceIp);

  const client = await db.connect();
  let isMatchingCustomer = false;
  let code: string | null = null;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [phoneHash]);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [ipHash]);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [REVIEW_SMS_LOCK]);
    await validateReviewLimits(client, phoneHash, ipHash);
    isMatchingCustomer = await findMatchingRequestCustomer(
      normalizeCustomerName(input.customerName),
      phone,
      client
    );
    if (isMatchingCustomer) {
      code = makeReviewOtp();
    }
    await client.query(
      `
        INSERT INTO review_verifications (
          id, pending_review, phone_hash, ip_hash, otp_digest, expires_at,
          status, sms_attempted
        )
        VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, $8)
      `,
      [
        verificationId,
        isMatchingCustomer ? JSON.stringify(normalizedInput) : null,
        code ? phoneHash : reviewDigest("phone-attempt", verificationId),
        ipHash,
        code ? reviewDigest("review-otp", `${verificationId}:${code}`) : null,
        expiresAt,
        isMatchingCustomer ? "pending" : "cancelled",
        isMatchingCustomer,
      ]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (code) {
    try {
      await sendReviewOtp(phone, code);
    } catch (error) {
      await db.query(
        `
          UPDATE review_verifications
          SET status = 'cancelled', pending_review = NULL, otp_digest = NULL
          WHERE id = $1 AND status = 'pending'
        `,
        [verificationId]
      );
      if (
        !(error instanceof ReviewVerificationError) ||
        error.statusCode !== 502
      ) {
        throw error;
      }
      logger.warn("Review verification SMS delivery failed");
    }
  }

  return { verificationId, expiresAt: expiresAt.toISOString() };
}

export async function confirmReviewVerification(
  verificationId: string,
  code: string
): Promise<Review> {
  const client = await db.connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    const result = await client.query<ReviewChallengeRow>(
      `
        SELECT id, pending_review, phone_hash, ip_hash, otp_digest,
               expires_at, attempt_count, status, review_id
        FROM review_verifications
        WHERE id = $1
        FOR UPDATE
      `,
      [verificationId]
    );
    const challenge = result.rows[0];
    if (!challenge) {
      throw new ReviewVerificationError(
        "That verification code is invalid or expired. Start again.",
        400
      );
    }
    if (challenge.status === "completed" && challenge.review_id) {
      const review = await client.query<Review>(
        `
          SELECT id, customer_name AS "customerName",
                 service_category AS "serviceCategory", rating,
                 review_text AS "reviewText", created_at AS "createdAt"
          FROM reviews WHERE id = $1
        `,
        [challenge.review_id]
      );
      await client.query("COMMIT");
      committed = true;
      if (!review.rows[0]) {
        throw new Error("Completed review could not be found.");
      }
      return review.rows[0];
    }

    if (
      challenge.status !== "pending" ||
      challenge.expires_at.getTime() <= Date.now() ||
      !challenge.pending_review
    ) {
      await client.query(
        `UPDATE review_verifications
         SET status = 'expired', pending_review = NULL, otp_digest = NULL
         WHERE id = $1 AND status = 'pending'`,
        [verificationId]
      );
      await client.query("COMMIT");
      committed = true;
      throw new ReviewVerificationError(
        "That verification code is invalid or expired. Start again.",
        400
      );
    }
    if (
      challenge.attempt_count >= REVIEW_MAX_ATTEMPTS ||
      !matchesDigest(
        challenge.otp_digest,
        reviewDigest("review-otp", `${verificationId}:${code}`)
      )
    ) {
      const attempts = challenge.attempt_count + 1;
      await client.query(
        `
          UPDATE review_verifications
          SET attempt_count = $2,
              status = CASE WHEN $2 >= $3 THEN 'expired' ELSE status END,
              pending_review = CASE WHEN $2 >= $3 THEN NULL ELSE pending_review END,
              otp_digest = CASE WHEN $2 >= $3 THEN NULL ELSE otp_digest END
          WHERE id = $1
        `,
        [verificationId, attempts, REVIEW_MAX_ATTEMPTS]
      );
      await client.query("COMMIT");
      committed = true;
      throw new ReviewVerificationError(
        "That verification code is invalid or expired. Start again.",
        400
      );
    }

    const input = challenge.pending_review;
    const stillMatches = await findMatchingRequestCustomer(
      normalizeCustomerName(input.customerName),
      input.phone,
      client
    );
    if (!stillMatches) {
      await client.query(
        `UPDATE review_verifications
         SET status = 'cancelled', pending_review = NULL, otp_digest = NULL
         WHERE id = $1`,
        [verificationId]
      );
      await client.query("COMMIT");
      committed = true;
      throw new ReviewVerificationError(
        "That verification code is invalid or expired. Start again.",
        400
      );
    }

    const review = await createReview(
      {
        customerName: input.customerName,
        serviceCategory: input.serviceCategory,
        rating: input.rating,
        reviewText: input.reviewText,
      },
      client
    );
    await client.query(
      `
        UPDATE review_verifications
        SET status = 'completed', pending_review = NULL, otp_digest = NULL,
            review_id = $2
        WHERE id = $1
      `,
      [verificationId, review.id]
    );
    await client.query("COMMIT");
    committed = true;
    return review;
  } catch (error) {
    if (!committed) {
      await client.query("ROLLBACK");
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function cleanExpiredReviewVerifications(): Promise<void> {
  await db.query(
    `
      UPDATE review_verifications
      SET status = 'expired', pending_review = NULL, otp_digest = NULL
      WHERE status = 'pending' AND expires_at <= NOW()
    `
  );
  await db.query(
    `
      DELETE FROM review_verifications
      WHERE created_at < NOW() - INTERVAL '24 hours'
        AND status <> 'pending'
    `
  );
}

export async function listReviews(): Promise<Review[]> {
  return getAllReviews();
}

export async function deleteReviewById(
  id: string
): Promise<Review | null> {
  return deleteReview(id);
}