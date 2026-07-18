import { nanoid } from "nanoid";

import { boardRepository } from "../board/repository.js";
import { NotFoundError } from "../shared/errors.js";

import { inviteRepository } from "./repository.js";
import type { CreateInviteDto } from "./schema.js";

class InviteService {
  private async assertBoardOwner(ownerId: string, boardId: string) {
    const board = await boardRepository.findOwnedById(boardId, ownerId);

    if (!board) {
      throw new NotFoundError("Board not found.");
    }

    return board;
  }

  async createInvite(
    ownerId: string,
    boardId: string,
    data: CreateInviteDto
  ) {
    await this.assertBoardOwner(ownerId, boardId);

    return inviteRepository.create({
      board: {
        connect: {
          id: boardId,
        },
      },
      token: nanoid(24),
      role: data.role,
      maxUses: data.maxUses ?? null,
      expiresAt: data.expiresAt ?? null,
    });
  }

  async listInvites(ownerId: string, boardId: string) {
    await this.assertBoardOwner(ownerId, boardId);

    return inviteRepository.findByBoardId(boardId);
  }

  async revokeInvite(ownerId: string, boardId: string, inviteId: string) {
    await this.assertBoardOwner(ownerId, boardId);

    const invite = await inviteRepository.findById(inviteId);

    if (!invite || invite.boardId !== boardId) {
      throw new NotFoundError("Invite not found.");
    }

    return inviteRepository.revoke(inviteId);
  }
}

export const inviteService = new InviteService();