import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./db/pool.js";

const app = buildApp();

async function start() {
  try {
    await checkDatabaseConnection();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(
      `Admin backend running at http://localhost:${env.PORT}`,
    );

    console.log(
      `Admin WebSocket running at ws://localhost:${env.PORT}/ws/requests`,
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

async function shutdown() {
  await app.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

void start();