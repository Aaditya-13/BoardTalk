import app from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { initializeSocket } from "./socket";
import { createServer } from "node:http";

const server = createServer(app);

initializeSocket(server);

server.listen(env.PORT, () => {
  logger.info(`BoardTalk API running on http://localhost:${env.PORT}`);
});