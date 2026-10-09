import { Pool } from "pg";
import { env } from "../config/env";

export const db = new Pool({
  connectionString: env.databaseUrl,
});

db.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});