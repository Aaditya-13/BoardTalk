import type { Prisma, Snapshot } from "../../generated/prisma/client.js";

import { collaboratorService } from "../collaborator/service.js";
import { NotFoundError } from "../shared/errors.js";

import { snapshotRepository } from "./repository.js";

class SnapshotService {
  async saveSnapshot(
    boardId: string,
    userId: string,
    documentJson: Prisma.InputJsonValue
  ): Promise<Snapshot> {
    await collaboratorService.assertBoardWriteAccess(boardId, userId);

    const latest = await snapshotRepository.findLatestByBoardId(boardId);

    return snapshotRepository.create({
      board: {
        connect: {
          id: boardId,
        },
      },
      version: (latest?.version ?? 0) + 1,
      documentJson,
    });
  }

  async getLatestSnapshot(boardId: string, userId: string) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    const snapshot = await snapshotRepository.findLatestByBoardId(boardId);

    if (!snapshot) {
      throw new NotFoundError("Snapshot not found.");
    }

    return snapshot;
  }
}

export const snapshotService = new SnapshotService();