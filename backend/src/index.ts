import type { Server } from "http";
import app from "./app.js";
import { connectDb, disconnectDb } from "./db/connection.js";
import { env } from "./config/env.js";
import { attachSocketServer } from "./socket/index.js";
import { ensureDeviceTokens } from "./services/index.js";

let server: Server | undefined;

async function main() {
  await connectDb();
  await ensureDeviceTokens();

  server = app.listen(env.port, () => {
    console.log(`Signape backend running on http://localhost:${env.port}`);
  });

  attachSocketServer(server);

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${env.port} is already in use. Stop the other process first:\n` +
          `  netstat -ano | findstr ":${env.port}"\n` +
          `  taskkill //PID <PID> //F`
      );
      process.exit(1);
    }

    console.error("Failed to start server:", error);
    process.exit(1);
  });
}

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down...`);
  server?.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch(async (error) => {
  console.error("Failed to start server:", error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
