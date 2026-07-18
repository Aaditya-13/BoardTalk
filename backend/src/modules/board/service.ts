import type {
  Board,
  Prisma,
} from "../../generated/prisma/client.js";

import { collaboratorService } from "../collaborator/service.js";
import { NotFoundError } from "../shared/errors.js";

import { boardRepository } from "./repository.js";
import type { CreateBoardDto } from "./schema.js";
import type { UpdateBoardDto } from "./schema.js";

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

  listBoards(ownerId: string): Promise<Board[]> {
    return collaboratorService.listAccessibleBoards(ownerId);
  }

  async getBoard(ownerId: string, boardId: string): Promise<Board> {
    await collaboratorService.assertBoardAccess(boardId, ownerId);

    const board = await boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    return board;
  }

  async updateBoard(
    ownerId: string,
    boardId: string,
    data: UpdateBoardDto
  ): Promise<Board> {
    await this.getBoard(ownerId, boardId);

    const updateData: Prisma.BoardUpdateInput = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility;
    }

    return boardRepository.updateById(boardId, updateData);
  }

  async deleteBoard(ownerId: string, boardId: string): Promise<void> {
    await this.getBoard(ownerId, boardId);

    await boardRepository.deleteById(boardId);
  }
}

export const boardService = new BoardService();