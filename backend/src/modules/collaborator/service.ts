import type { CollaboratorRole } from "../../generated/prisma/client.js";

import { boardRepository } from "../board/repository.js";
import { ForbiddenError, NotFoundError } from "../shared/errors.js";

import { collaboratorRepository } from "./repository.js";

class CollaboratorService {
  async getMembership(boardId: string, userId: string) {
    const board = await boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    if (board.ownerId === userId) {
      return {
        boardId,
        userId,
        role: "OWNER" as CollaboratorRole,
        joinedAt: board.createdAt,
      };
    }

    const membership = await collaboratorRepository.findByBoardAndUser(
      boardId,
      userId
    );

    if (!membership) {
      throw new NotFoundError("Membership not found.");
    }

    return membership;
  }

  async assertBoardAccess(boardId: string, userId: string): Promise<CollaboratorRole> {
    const board = await boardRepository.findById(boardId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    if (board.ownerId === userId) {
      return "OWNER";
    }

    const membership = await collaboratorRepository.findByBoardAndUser(
      boardId,
      userId
    );

    if (membership) {
      return membership.role;
    }

    if (board.visibility === "PUBLIC") {
      return "VIEWER";
    }

    throw new ForbiddenError("You do not have access to this board.");
  }

  async assertBoardWriteAccess(boardId: string, userId: string): Promise<CollaboratorRole> {
    const role = await this.assertBoardAccess(boardId, userId);

    if (role === "OWNER" || role === "EDITOR") {
      return role;
    }

    throw new ForbiddenError("You do not have permission to modify this board.");
  }

  async listAccessibleBoards(userId: string) {
    return boardRepository.findManyAccessibleByUser(userId);
  }

  async listCollaborators(ownerId: string, boardId: string) {
    const board = await boardRepository.findOwnedById(boardId, ownerId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    return collaboratorRepository.findByBoardId(boardId);
  }

  async updateCollaboratorRole(
    ownerId: string,
    boardId: string,
    collaboratorId: string,
    role: CollaboratorRole
  ) {
    const board = await boardRepository.findOwnedById(boardId, ownerId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    const collaborator = await collaboratorRepository.findById(collaboratorId);

    if (!collaborator || collaborator.boardId !== boardId) {
      throw new NotFoundError("Collaborator not found.");
    }

    return collaboratorRepository.updateRole(collaboratorId, role);
  }

  async removeCollaborator(
    ownerId: string,
    boardId: string,
    collaboratorId: string
  ) {
    const board = await boardRepository.findOwnedById(boardId, ownerId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    const collaborator = await collaboratorRepository.findById(collaboratorId);

    if (!collaborator || collaborator.boardId !== boardId) {
      throw new NotFoundError("Collaborator not found.");
    }

    return collaboratorRepository.deleteById(collaboratorId);
  }
}

export const collaboratorService = new CollaboratorService();