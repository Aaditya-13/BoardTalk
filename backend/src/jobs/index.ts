import { logger } from "../lib/logger.js";
import { cleanupExpiredTokens } from "./cleanupExpiredTokens.js";
import { cleanupOldSnapshots } from "./cleanupOldSnapshots.js";

// TODO: migrate to BullMQ when Redis is added

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Starts all in-process cleanup jobs.
 * Call once after server.listen().
 */
export function startCleanupJobs(): void {
  setInterval(() => {
    void cleanupExpiredTokens();
  }, ONE_HOUR_MS);

  setInterval(() => {
    void cleanupOldSnapshots();
  }, ONE_DAY_MS);

  logger.info("Cleanup jobs started (tokens: 1h, snapshots: 24h)");
}
