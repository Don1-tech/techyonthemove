import type { PoolClient } from "pg";
import { db } from "../../db/client";
import type { CreateReviewInput, Review } from "./reviews.types";
import { normalizeCustomerName } from "./reviewValidation";

export async function findMatchingRequestCustomer(
  normalizedName: string,
  client: PoolClient | typeof db = db
): Promise<boolean> {
  const result = await client.query<{ id: string }>(
    `
      SELECT id
      FROM requests
      WHERE lower(
        regexp_replace(btrim(full_name), '[[:space:]]+', ' ', 'g')
      ) = $1
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    `,
    [normalizeCustomerName(normalizedName)]
  );

  return result.rows.length > 0;
}

export async function createReview(
  input: CreateReviewInput,
  client: PoolClient | typeof db = db
): Promise<Review> {
  const result = await client.query<Review>(
    `
      INSERT INTO reviews (
        customer_name,
        service_category,
        rating,
        review_text
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        customer_name AS "customerName",
        service_category AS "serviceCategory",
        rating,
        review_text AS "reviewText",
        created_at AS "createdAt";
    `,
    [
      input.customerName,
      input.serviceCategory,
      input.rating,
      input.reviewText,
    ]
  );

  return result.rows[0];
}

export async function getAllReviews(): Promise<Review[]> {
  const result = await db.query<Review>(
    `
      SELECT
        id,
        customer_name AS "customerName",
        service_category AS "serviceCategory",
        rating,
        review_text AS "reviewText",
        created_at AS "createdAt"
      FROM reviews
      ORDER BY rating DESC, created_at DESC;
    `
  );

  return result.rows;
}

export async function deleteReview(
  id: string
): Promise<Review | null> {
  const result = await db.query<Review>(
    `
      DELETE FROM reviews
      WHERE id = $1
      RETURNING
        id,
        customer_name AS "customerName",
        service_category AS "serviceCategory",
        rating,
        review_text AS "reviewText",
        created_at AS "createdAt";
    `,
    [id]
  );

  return result.rows[0] ?? null;
}