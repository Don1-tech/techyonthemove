import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

export class SubmissionConflictError extends Error {
  readonly statusCode = 409;

  constructor() {
    super(
      "This submission key was already used with different information. Refresh the security check and try again."
    );
  }
}

export function hashSubmissionPayload(
  kind: "request" | "review",
  payload: object
): string {
  return createHash("sha256")
    .update(JSON.stringify({ kind, payload }))
    .digest("hex");
}

export async function lockSubmissionKey(
  client: PoolClient,
  key: string
): Promise<void> {
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext($1))",
    [`public-submission:${key}`]
  );
}

export async function removeExpiredSubmissionKeys(
  client: PoolClient
): Promise<void> {
  await client.query(
    `
      DELETE FROM submission_idempotency
      WHERE created_at < NOW() - INTERVAL '24 hours'
    `
  );
}
