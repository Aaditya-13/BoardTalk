import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class InviteRepository {
  create(data: Prisma.InviteCreateInput) {
    return prisma.invite.create({
      data,
    });
  }

  findByBoardId(boardId: string) {
    return prisma.invite.findMany({
      where: {
        boardId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(inviteId: string) {
    return prisma.invite.findUnique({
      where: {
        id: inviteId,
      },
    });
  }

  revoke(inviteId: string) {
    return prisma.invite.update({
      where: {
        id: inviteId,
      },
      data: {
        isActive: false,
      },
    });
  }
}

export const inviteRepository = new InviteRepository();