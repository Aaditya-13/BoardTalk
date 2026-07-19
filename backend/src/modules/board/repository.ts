import { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class BoardRepository {
  create(data: Prisma.BoardCreateInput) {
    return prisma.board.create({
      data,
    });
  }

  findManyByOwnerId(ownerId: string) {
    return prisma.board.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findManyAccessibleByUser(userId: string, search?: string) {
    return prisma.board.findMany({
      where: {
        AND: [
          {
            OR: [
              { ownerId: userId },
              { collaborators: { some: { userId } } },
            ],
          },
          ...(search
            ? [{ title: { contains: search, mode: Prisma.QueryMode.insensitive } }]
            : []),
          { deletedAt: null },
        ],
      },
      include: {
        starredBy: {
          where: { userId },
        },
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  findById(id: string) {
    return prisma.board.findUnique({
      where: { id },
    });
  }

  findOwnedById(boardId: string, ownerId: string) {
    return prisma.board.findFirst({
      where: {
        id: boardId,
        ownerId,
      },
    });
  }

  updateById(id: string, data: Prisma.BoardUpdateInput) {
    return prisma.board.update({
      where: { id },
      data,
    });
  }

  findTrashedByUser(userId: string) {
    return prisma.board.findMany({
      where: {
        ownerId: userId,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    });
  }

  findStarredByUser(userId: string) {
    return prisma.board.findMany({
      where: {
        starredBy: { some: { userId } },
        deletedAt: null,
      },
      include: {
        starredBy: { where: { userId } },
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  deleteById(id: string) {
    return prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async toggleStar(boardId: string, userId: string) {
    const existing = await prisma.starredBoard.findUnique({
      where: {
        userId_boardId: { userId, boardId },
      },
    });

    if (existing) {
      await prisma.starredBoard.delete({
        where: {
          userId_boardId: { userId, boardId },
        },
      });
      return false;
    }

    await prisma.starredBoard.create({
      data: { userId, boardId },
    });
    return true;
  }
}

export const boardRepository = new BoardRepository();