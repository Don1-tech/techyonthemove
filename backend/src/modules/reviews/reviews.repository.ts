import type { PoolClient } from "pg";
import { db } from "../../db/client";
import type { CreateReviewInput, Review } from "./reviews.types";
import { normalizeCustomerName } from "./reviewValidation";

export async function findMatchingRequestCustomer(
  normalizedName: string,
  normalizedPhone: string,
  client: PoolClient | typeof db = db
): Promise<boolean> {
  const phoneDigits = normalizedPhone.slice(1);
  const localPhone = `0${phoneDigits.slice(3)}`;
  const nationalPhone = phoneDigits.slice(3);

  const result = await client.query<{ full_name: string }>(
    `
      SELECT full_name
      FROM requests
      WHERE regexp_replace(phone, '[^0-9]', '', 'g') = ANY($1::text[])
    `,
    [[phoneDigits, localPhone, nationalPhone]]
  );

  return result.rows.some(
    (row) => normalizeCustomerName(row.full_name) === normalizedName
  );
}

export async function createReview(
  input: Omit<CreateReviewInput, "phone">,
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
      ORDER BY rating DESC;
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