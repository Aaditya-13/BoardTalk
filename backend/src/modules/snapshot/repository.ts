import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class SnapshotRepository {
  create(data: Prisma.SnapshotCreateInput) {
    return prisma.snapshot.create({
      data,
    });
  }

  deleteManyBeforeVersion(boardId: string, version: number) {
    return prisma.snapshot.deleteMany({
      where: {
        boardId,
        version: {
          lt: version,
        },
      },
    });
  }

  findManyByBoardId(boardId: string) {
    return prisma.snapshot.findMany({
      where: {
        boardId,
      },
      select: {
        id: true,
        boardId: true,
        version: true,
        createdAt: true,
      },
      orderBy: {
        version: "desc",
      },
    });
  }

  findByBoardIdAndVersion(boardId: string, version: number) {
    return prisma.snapshot.findUnique({
      where: {
        boardId_version: {
          boardId,
          version,
        },
      },
    });
  }

  findByBoardIdAndVersions(boardId: string, versions: number[]) {
    return prisma.snapshot.findMany({
      where: {
        boardId,
        version: {
          in: versions,
        },
      },
      orderBy: {
        version: "asc",
      },
    });
  }

  findLatestByBoardId(boardId: string) {
    return prisma.snapshot.findFirst({
      where: {
        boardId,
      },
      orderBy: {
        version: "desc",
      },
    });
  }
}

export const snapshotRepository = new SnapshotRepository();