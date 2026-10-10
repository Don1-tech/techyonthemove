import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import {
  checkDatabaseConnection,
  pool,
} from "./db/pool.js";
import {
  startPostgresNotifications,
  stopPostgresNotifications,
} from "./modules/realtime/postgresNotifications.js";

const app = buildApp();

let shuttingDown = false;

async function start(): Promise<void> {
  try {
    await checkDatabaseConnection();
    await startPostgresNotifications();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(
      `Admin backend listening on port ${env.PORT}`,
    );
    app.log.info("Admin WebSocket endpoint: /ws/requests");
  } catch (error) {
    app.log.error(error);

    await stopPostgresNotifications();
    await pool.end().catch(() => undefined);
    await app.close().catch(() => undefined);

    process.exitCode = 1;
  }
}

async function shutdown(): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await app.close();
    await stopPostgresNotifications();
    await pool.end();

    app.log.info("Admin backend shut down cleanly.");
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});

void start();