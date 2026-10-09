import { db } from "../../db/client";
import type { Service } from "./services.types";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  base_price: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    basePrice:
      row.base_price === null
        ? null
        : Number(row.base_price),
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findAllActiveServices(): Promise<Service[]> {
  const result = await db.query<ServiceRow>(
    `
      SELECT
        id,
        name,
        description,
        base_price,
        is_active,
        created_at,
        updated_at
      FROM services
      WHERE is_active = TRUE
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapService);
}

export async function findServiceById(
  id: string
): Promise<Service | null> {
  const result = await db.query<ServiceRow>(
    `
      SELECT
        id,
        name,
        description,
        base_price,
        is_active,
        created_at,
        updated_at
      FROM services
      WHERE id = $1
        AND is_active = TRUE
      LIMIT 1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapService(result.rows[0]);
}