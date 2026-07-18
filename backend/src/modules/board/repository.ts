import type { Prisma } from "../../generated/prisma/client.js";

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

  findManyAccessibleByUser(userId: string) {
    return prisma.board.findMany({
      where: {
        OR: [
          {
            ownerId: userId,
          },
          {
            collaborators: {
              some: {
                userId,
              },
            },
          },
        ],
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
}

export const boardRepository = new BoardRepository();