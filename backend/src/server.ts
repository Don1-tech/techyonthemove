import { buildApp } from "./app";
import { env } from "./config/env";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({
      port: env.port,
      host: env.host,
    });

    console.log(
      `Techy On The Move API running on http://localhost:${env.port}`
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();