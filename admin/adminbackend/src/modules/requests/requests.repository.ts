import { pool } from "../../db/pool.js";

import type {
  RequestStatus,
  ServiceRequest,
} from "./requests.types.js";


/* =========================================================
   DATABASE ROW
   ========================================================= */

interface RequestRow {
  id: string;

  reference: string;

  service_id: string;

  issue_id: string | null;

  issue_details: string;

  full_name: string;

  phone: string;

  email: string;

  location: string;

  directions: string;

  requested_date: string;

  requested_time: string;

  status: RequestStatus;

  created_at: string;

  updated_at: string;

  approximate_price:
    | string
    | number
    | null;
}


/* =========================================================
   MAP DATABASE ROW
   ========================================================= */

function mapRequest(
  row: RequestRow,
): ServiceRequest {
  return {
    id: row.id,

    reference:
      row.reference,

    serviceId:
      row.service_id,

    issueId:
      row.issue_id,

    issueDetails:
      row.issue_details,

    fullName:
      row.full_name,

    phone:
      row.phone,

    email:
      row.email,

    location:
      row.location,

    directions:
      row.directions,

    requestedDate:
      row.requested_date,

    requestedTime:
      row.requested_time,

    status:
      row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    approximatePrice:
      row.approximate_price ===
      null
        ? null
        : Number(
            row.approximate_price,
          ),
  };
}


/* =========================================================
   SELECT COLUMNS
   ========================================================= */

const SELECT_COLUMNS = `
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
  requested_date::text AS requested_date,
  TO_CHAR(
    requested_time,
    'HH24:MI'
  ) AS requested_time,
  status,
  created_at::text AS created_at,
  updated_at::text AS updated_at,
  approximate_price
`;


/* =========================================================
   FIND REQUESTS
   ========================================================= */

export async function findRequests(
  status?: RequestStatus,
  search?: string,
): Promise<ServiceRequest[]> {
  const values: unknown[] = [];

  const conditions: string[] = [];


  /* =======================================================
     STATUS FILTER
     ======================================================= */

  if (status) {
    values.push(status);

    conditions.push(
      `status = $${values.length}`,
    );
  }


  /* =======================================================
     SEARCH
     ======================================================= */

  if (search?.trim()) {
    values.push(
      `%${search.trim()}%`,
    );

    const parameter =
      `$${values.length}`;

    conditions.push(`
      (
        phone ILIKE ${parameter}
        OR full_name ILIKE ${parameter}
        OR email ILIKE ${parameter}
        OR reference ILIKE ${parameter}
        OR service_id ILIKE ${parameter}
        OR location ILIKE ${parameter}
      )
    `);
  }


  /* =======================================================
     WHERE CLAUSE
     ======================================================= */

  const where =
    conditions.length > 0
      ? `WHERE ${conditions.join(
          " AND ",
        )}`
      : "";


  /* =======================================================
     DATABASE QUERY
     ======================================================= */

  const result =
    await pool.query<RequestRow>(
      `
        SELECT ${SELECT_COLUMNS}

        FROM requests

        ${where}

        ORDER BY
          created_at DESC
      `,
      values,
    );


  /* =======================================================
     MAP RESULTS
     ======================================================= */

  return result.rows.map(
    mapRequest,
  );
}


/* =========================================================
   FIND REQUEST BY ID
   ========================================================= */

export async function findRequestById(
  id: string,
): Promise<ServiceRequest | null> {
  const result =
    await pool.query<RequestRow>(
      `
        SELECT ${SELECT_COLUMNS}

        FROM requests

        WHERE id = $1

        LIMIT 1
      `,
      [id],
    );

  return result.rows[0]
    ? mapRequest(
        result.rows[0],
      )
    : null;
}


/* =========================================================
   UPDATE REQUEST STATUS
   ========================================================= */

export async function updateRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<ServiceRequest | null> {
  const result =
    await pool.query<RequestRow>(
      `
        UPDATE requests

        SET
          status = $2,
          updated_at = NOW()

        WHERE id = $1

        RETURNING ${SELECT_COLUMNS}
      `,
      [
        id,
        status,
      ],
    );

  return result.rows[0]
    ? mapRequest(
        result.rows[0],
      )
    : null;
}