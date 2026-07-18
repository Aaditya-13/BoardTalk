import type { Board } from "../../generated/prisma/client.js";

import { boardRepository } from "./repository.js";
import type { CreateBoardDto } from "./schema.js";

class BoardService {
  createBoard(ownerId: string, data: CreateBoardDto): Promise<Board> {
    return boardRepository.create({
      title: data.title,
      description: data.description ?? null,
      visibility: data.visibility ?? "PRIVATE",
      owner: {
        connect: {
          id: ownerId,
        },
      },
    });
  }
}

export const boardService = new BoardService();