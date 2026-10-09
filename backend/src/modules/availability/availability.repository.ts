import { db } from "../../db/client";

interface BookedSlotRow {
  requested_date: string;
  requested_time: string;
}

export async function findBookedSlots(
  startDate: string,
  endDate: string
): Promise<BookedSlotRow[]> {
  const result = await db.query<BookedSlotRow>(
    `
      SELECT
        requested_date::text AS requested_date,
        TO_CHAR(requested_time, 'HH24:MI') AS requested_time
      FROM requests
      WHERE requested_date BETWEEN $1 AND $2
        AND status NOT IN ('cancelled')
      ORDER BY requested_date ASC, requested_time ASC
    `,
    [startDate, endDate]
  );

  return result.rows;
}