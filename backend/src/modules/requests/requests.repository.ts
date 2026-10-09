import { db } from "../../db/client";
import type { CreateRequestInput, Request } from "./requests.types";

interface RequestRow {
  id: string;
  reference: string;
  service_id: string;
  issue_id: string | null;
  issue_details: string | null;
  full_name: string;
  phone: string;
  email: string;
  location: string;
  directions: string | null;
  requested_date: string;
  requested_time: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  approximate_price: string | null;
}

function mapRequest(row: RequestRow): Request {
  return {
    id: row.id,
    reference: row.reference,
    serviceId: row.service_id,
    issueId: row.issue_id,
    issueDetails: row.issue_details,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    location: row.location,
    directions: row.directions,
    requestedDate: row.requested_date,
    requestedTime: row.requested_time,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    approximatePrice:
      row.approximate_price === null
        ? null
        : Number(row.approximate_price),
  };
}

export async function createRequest(
  input: CreateRequestInput,
  reference: string,
  approximatePrice: number | null
): Promise<Request> {
  const result = await db.query<RequestRow>(
    `
      INSERT INTO requests (
        reference,
        service_id,
        issue_id,
        issue_details,
        full_name,
        phone,
        email,
        location,
        directions,
        requested_date,
        requested_time,
        approximate_price
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12
      )
      RETURNING
        id,
        reference,
        service_id,
        issue_id,
        issue_details,
        full_name,
        phone,
        email,
        location,
        directions,
        requested_date,
        requested_time,
        status,
        created_at,
        updated_at,
        approximate_price
    `,
    [
      reference,
      input.serviceId,
      input.issueId ?? null,
      input.issueDetails ?? null,
      input.fullName,
      input.phone,
      input.email,
      input.location,
      input.directions ?? null,
      input.requestedDate,
      input.requestedTime,
      approximatePrice,
    ]
  );

  return mapRequest(result.rows[0]);
}
