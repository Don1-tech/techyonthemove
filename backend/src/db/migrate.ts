import fs from "node:fs/promises";
import path from "node:path";

import { db } from "./client";

async function migrate() {
  const migrationsDirectory = path.join(
    process.cwd(),
    "src",
    "db",
    "migrations"
  );

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = await fs.readdir(migrationsDirectory);

  const migrationFiles = files
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const filename of migrationFiles) {
    const existingMigration = await db.query(
      `
        SELECT filename
        FROM schema_migrations
        WHERE filename = $1
      `,
      [filename]
    );

    if (existingMigration.rowCount && existingMigration.rowCount > 0) {
      console.log(`Skipping ${filename}`);
      continue;
    }

    const filePath = path.join(
      migrationsDirectory,
      filename
    );

    const sql = await fs.readFile(filePath, "utf8");

    console.log(`Running ${filename}...`);

    await db.query("BEGIN");

    try {
      await db.query(sql);

      await db.query(
        `
          INSERT INTO schema_migrations (filename)
          VALUES ($1)
        `,
        [filename]
      );

      await db.query("COMMIT");

      console.log(`Completed ${filename}`);
    } catch (error) {
      await db.query("ROLLBACK");

      console.error(
        `Migration failed: ${filename}`
      );

      throw error;
    }
  }

  console.log("Database migrations completed.");

  await db.end();
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});