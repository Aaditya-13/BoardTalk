import type { Prisma } from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

class BoardRepository {
  create(data: Prisma.BoardCreateInput) {
    return prisma.board.create({
      data,
    });
  }

  findById(id: string) {
    return prisma.board.findUnique({
      where: { id },
    });
  }
}

export const boardRepository = new BoardRepository();