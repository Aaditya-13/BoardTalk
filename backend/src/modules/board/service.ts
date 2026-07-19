import type {
  Board,
  Prisma,
} from "../../generated/prisma/client.js";

import { collaboratorService } from "../collaborator/service.js";
import { snapshotRepository } from "../snapshot/repository.js";
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

  async listBoards(ownerId: string, search?: string) {
    const boards = await boardRepository.findManyAccessibleByUser(ownerId, search);
    return boards.map((board) => {
      const { starredBy, ...rest } = board;
      return {
        ...rest,
        isStarred: starredBy.length > 0,
      };
    });
  }

  async listTrashed(ownerId: string) {
    const boards = await boardRepository.findTrashedByUser(ownerId);
    return boards.map((board) => ({ ...board, isStarred: false }));
  }

  async listStarred(ownerId: string) {
    const boards = await boardRepository.findStarredByUser(ownerId);
    return boards.map((board) => {
      const { starredBy, ...rest } = board;
      return {
        ...rest,
        isStarred: true,
      };
    });
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

    if (data.canvasColor !== undefined) {
      updateData.canvasColor = data.canvasColor;
    }

    return boardRepository.updateById(boardId, updateData);
  }

  async deleteBoard(ownerId: string, boardId: string): Promise<void> {
    await this.getBoard(ownerId, boardId);

    await boardRepository.deleteById(boardId);
  }

  async toggleStar(ownerId: string, boardId: string): Promise<boolean> {
    await collaboratorService.assertBoardAccess(boardId, ownerId);
    return boardRepository.toggleStar(boardId, ownerId);
  }

  async duplicateBoard(ownerId: string, boardId: string): Promise<Board> {
    // 1. Fetch original board
    const originalBoard = await this.getBoard(ownerId, boardId);

    // 2. Create new board
    const newBoard = await boardRepository.create({
      title: `${originalBoard.title} (Copy)`,
      description: originalBoard.description,
      visibility: "PRIVATE",
      canvasColor: originalBoard.canvasColor,
      owner: {
        connect: {
          id: ownerId,
        },
      },
    });

    // 3. Fetch latest snapshot of original board
    const latestSnapshot = await snapshotRepository.findLatestByBoardId(boardId);

    // 4. Duplicate snapshot to new board if it exists
    if (latestSnapshot && latestSnapshot.documentJson) {
      await snapshotRepository.create({
        board: {
          connect: {
            id: newBoard.id,
          },
        },
        version: 1,
        documentJson: latestSnapshot.documentJson,
      });
    }

    return newBoard;
  }
}

export const boardService = new BoardService();