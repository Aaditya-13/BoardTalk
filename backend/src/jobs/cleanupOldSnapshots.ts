import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { SNAPSHOT_RETENTION_LIMIT } from "../modules/snapshot/constants.js";

// TODO: migrate to BullMQ when Redis is added

/**
 * For every board that has more snapshots than SNAPSHOT_RETENTION_LIMIT,
 * delete the oldest excess snapshots.
 *
 * Write-time enforcement already handles boards that are actively edited.
 * This job catches boards that were last edited before the retention limit
 * was introduced, or boards where the write-time pruning was skipped.
 *
 * Runs every 24 hours via startCleanupJobs().
 */
export async function cleanupOldSnapshots(): Promise<void> {
  try {
    // Find boards that have excess snapshots
    const boards = await prisma.board.findMany({
      select: { id: true },
    });

    let totalDeleted = 0;

    for (const board of boards) {
      // Fetch the Nth-from-top version number (where N = retention limit)
      const cutoffSnapshot = await prisma.snapshot.findFirst({
        where: { boardId: board.id },
        orderBy: { version: "desc" },
        skip: SNAPSHOT_RETENTION_LIMIT - 1,
        select: { version: true },
      });

      if (!cutoffSnapshot) {
        // Board has fewer snapshots than the limit — nothing to prune
        continue;
      }

      const { count } = await prisma.snapshot.deleteMany({
        where: {
          boardId: board.id,
          version: { lt: cutoffSnapshot.version },
        },
      });

      totalDeleted += count;
    }

    if (totalDeleted > 0) {
      logger.info({ totalDeleted }, "Cleaned up old snapshots");
    }
  } catch (error) {
    logger.error({ error }, "Failed to clean up old snapshots");
  }
}
