import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class CollaboratorRepository {
  create(data: Prisma.CollaboratorCreateInput) {
    return prisma.collaborator.create({
      data,
    });
  }

  findById(id: string) {
    return prisma.collaborator.findUnique({
      where: {
        id,
      },
    });
  }

  findByBoardAndUser(boardId: string, userId: string) {
    return prisma.collaborator.findUnique({
      where: {
        boardId_userId: {
          boardId,
          userId,
        },
      },
    });
  }

  findByBoardId(boardId: string) {
    return prisma.collaborator.findMany({
      where: {
        boardId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          }
        }
      },
      orderBy: {
        joinedAt: "asc",
      },
    });
  }

  updateRole(id: string, role: Prisma.CollaboratorUpdateInput["role"]) {
    return prisma.collaborator.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });
  }

  deleteById(id: string) {
    return prisma.collaborator.delete({
      where: {
        id,
      },
    });
  }
}

export const collaboratorRepository = new CollaboratorRepository();