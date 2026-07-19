import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class CommentRepository {
  create(data: Prisma.CommentCreateInput) {
    return prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
    });
  }

  findManyByBoardId(boardId: string) {
    return prisma.comment.findMany({
      where: { boardId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  update(id: string, data: Prisma.CommentUpdateInput) {
    return prisma.comment.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  deleteById(id: string) {
    return prisma.comment.delete({
      where: { id },
    });
  }
}

export const commentRepository = new CommentRepository();
