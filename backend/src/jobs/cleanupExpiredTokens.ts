import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

// TODO: migrate to BullMQ when Redis is added

/**
 * Deletes all RefreshTokens that have either expired or been explicitly revoked.
 * Runs every hour via startCleanupJobs().
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const { count } = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { revokedAt: { not: null } },
        ],
      },
    });

    if (count > 0) {
      logger.info({ count }, "Cleaned up expired/revoked refresh tokens");
    }
  } catch (error) {
    logger.error({ error }, "Failed to clean up expired refresh tokens");
  }
}
