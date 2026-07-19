import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

const MESSAGE_SELECT = {
  id: true,
  boardId: true,
  content: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  },
} as const;

class ChatRepository {
  create(data: Prisma.ChatMessageCreateInput) {
    return prisma.chatMessage.create({
      data,
      select: MESSAGE_SELECT,
    });
  }

  findManyByBoardId(boardId: string, before?: Date, limit = 50) {
    return prisma.chatMessage.findMany({
      where: {
        boardId,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      select: MESSAGE_SELECT,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const chatRepository = new ChatRepository();
