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
        ],
      },
      include: {
        starredBy: {
          where: { userId },
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

  deleteById(id: string) {
    return prisma.board.delete({
      where: { id },
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