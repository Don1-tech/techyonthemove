import type { PoolClient } from "pg";

import {
  hashSubmissionPayload,
  lockSubmissionKey,
  removeExpiredSubmissionKeys,
  SubmissionConflictError,
} from "../../db/submissionIdempotency";
import { db } from "../../db/client";
import { createReview, deleteReview, findMatchingRequestCustomer, getAllReviews } from "./reviews.repository";
import type { CreateReviewInput, Review } from "./reviews.types";
import {
  normalizeCustomerName,
  ReviewValidationError,
  validateReviewSubmission,
} from "./reviewValidation";

const NAME_MISMATCH_MESSAGE =
  "Sorry, we couldn't verify your name against a service request. Please check the name you used when booking and try again.";

export class ReviewEligibilityError extends Error {
  readonly statusCode = 403;

  constructor() {
    super(NAME_MISMATCH_MESSAGE);
  }
}

function validateInput(input: CreateReviewInput): CreateReviewInput {
  const customerName = input.customerName.trim().replace(/\s+/g, " ");
  const serviceCategory = input.serviceCategory.trim();
  const reviewText = input.reviewText.trim();

  if (
    !customerName ||
    customerName.length > 120 ||
    !serviceCategory ||
    serviceCategory.length > 150 ||
    !Number.isInteger(input.rating) ||
    input.rating < 1 ||
    input.rating > 5 ||
    !reviewText ||
    reviewText.length > 1000
  ) {
    throw new ReviewValidationError(
      "Check your name, service category, rating, and review text."
    );
  }

  const validationError = validateReviewSubmission(customerName, reviewText);
  if (validationError) {
    throw new ReviewValidationError(validationError);
  }

  return { customerName, serviceCategory, rating: input.rating, reviewText };
}

async function findExistingSubmission(
  client: PoolClient,
  idempotencyKey: string
): Promise<{
  payload_hash: string;
  request_id: string | null;
  review_id: string | null;
} | null> {
  const result = await client.query<{
    payload_hash: string;
    request_id: string | null;
    review_id: string | null;
  }>(
    `
      SELECT payload_hash, request_id, review_id
      FROM submission_idempotency
      WHERE idempotency_key = $1
      FOR UPDATE
    `,
    [idempotencyKey]
  );
  return result.rows[0] ?? null;
}

export async function submitReview(
  rawInput: CreateReviewInput,
  idempotencyKey: string
): Promise<Review> {
  const input = validateInput(rawInput);
  const payloadHash = hashSubmissionPayload("review", input);
  const client = await db.connect();
  let committed = false;

  try {
    await client.query("BEGIN");
    await lockSubmissionKey(client, idempotencyKey);
    await removeExpiredSubmissionKeys(client);

    const existing = await findExistingSubmission(client, idempotencyKey);
    if (existing) {
      if (
        existing.payload_hash !== payloadHash ||
        existing.request_id ||
        !existing.review_id
      ) {
        throw new SubmissionConflictError();
      }
      const reviewResult = await client.query<Review>(
        `
          SELECT
            id,
            customer_name AS "customerName",
            service_category AS "serviceCategory",
            rating,
            review_text AS "reviewText",
            created_at AS "createdAt"
          FROM reviews
          WHERE id = $1
        `,
        [existing.review_id]
      );
      const review = reviewResult.rows[0];
      if (!review) {
        throw new Error("Idempotent review record is missing.");
      }
      await client.query("COMMIT");
      committed = true;
      return review;
    }

    const matches = await findMatchingRequestCustomer(
      normalizeCustomerName(input.customerName),
      client
    );
    if (!matches) {
      throw new ReviewEligibilityError();
    }

    const review = await createReview(input, client);
    await client.query(
      `
        INSERT INTO submission_idempotency (
          idempotency_key, payload_hash, review_id
        )
        VALUES ($1, $2, $3)
      `,
      [idempotencyKey, payloadHash, review.id]
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

export async function listReviews(): Promise<Review[]> {
  return getAllReviews();
}

export async function deleteReviewById(
  id: string
): Promise<Review | null> {
  return deleteReview(id);
}
