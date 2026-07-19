import type { Prisma, Snapshot } from "../../generated/prisma/client.js";

import { boardRepository } from "../board/repository.js";
import { collaboratorService } from "../collaborator/service.js";
import { SNAPSHOT_RETENTION_LIMIT } from "./constants.js";
import { NotFoundError } from "../shared/errors.js";

import { snapshotRepository } from "./repository.js";

class SnapshotService {
  private async createSnapshot(
    boardId: string,
    documentJson: Prisma.InputJsonValue
  ): Promise<Snapshot> {
    const latest = await snapshotRepository.findLatestByBoardId(boardId);
    const nextVersion = (latest?.version ?? 0) + 1;

    const snapshot = await snapshotRepository.create({
      board: {
        connect: {
          id: boardId,
        },
      },
      version: nextVersion,
      documentJson,
    });

    const minimumVersionToKeep = nextVersion - SNAPSHOT_RETENTION_LIMIT + 1;

    if (minimumVersionToKeep > 1) {
      await snapshotRepository.deleteManyBeforeVersion(
        boardId,
        minimumVersionToKeep
      );
    }

    return snapshot;
  }

  async saveSnapshot(
    boardId: string,
    userId: string,
    documentJson: Prisma.InputJsonValue
  ): Promise<Snapshot> {
    await collaboratorService.assertBoardWriteAccess(boardId, userId);

    return this.createSnapshot(boardId, documentJson);
  }

  async listSnapshots(boardId: string, userId: string) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    return snapshotRepository.findManyByBoardId(boardId);
  }

  async compareSnapshots(
    boardId: string,
    userId: string,
    fromVersion: number,
    toVersion: number
  ) {
    const board = await boardRepository.findOwnedById(boardId, userId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    const snapshots = await snapshotRepository.findByBoardIdAndVersions(
      boardId,
      [fromVersion, toVersion]
    );

    if (snapshots.length !== 2) {
      throw new NotFoundError("Snapshot not found.");
    }

    const [fromSnapshot, toSnapshot] = snapshots;

    return {
      fromSnapshot,
      toSnapshot,
      sameDocument:
        JSON.stringify(fromSnapshot.documentJson) ===
        JSON.stringify(toSnapshot.documentJson),
    };
  }

  async restoreSnapshot(boardId: string, userId: string, version: number) {
    const board = await boardRepository.findOwnedById(boardId, userId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    const snapshot = await snapshotRepository.findByBoardIdAndVersion(
      boardId,
      version
    );

    if (!snapshot) {
      throw new NotFoundError("Snapshot not found.");
    }

    return this.createSnapshot(
      boardId,
      snapshot.documentJson as Prisma.InputJsonValue
    );
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