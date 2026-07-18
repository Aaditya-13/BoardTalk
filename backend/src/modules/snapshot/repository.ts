import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class SnapshotRepository {
  create(data: Prisma.SnapshotCreateInput) {
    return prisma.snapshot.create({
      data,
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