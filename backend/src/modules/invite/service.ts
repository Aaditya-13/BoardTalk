import { nanoid } from "nanoid";

import { prisma } from "../../lib/prisma.js";
import { InviteType } from "../../generated/prisma/client.js";
import { ConflictError, NotFoundError } from "../shared/errors.js";

import { boardRepository } from "../board/repository.js";
import { collaboratorRepository } from "../collaborator/repository.js";

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

    let token = nanoid(24);
    if (data.type === "SHORT_CODE") {
      // 3 uppercase letters, 3 numbers
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const numbers = "0123456789";
      let code = "";
      for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
      for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      token = code;
    }

    return inviteRepository.create({
      board: {
        connect: {
          id: boardId,
        },
      },
      token,
      role: data.role,
      type: data.type,
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

  async acceptInvite(userId: string, token: string) {
    const invite = await inviteRepository.findByToken(token);

    if (!invite || !invite.isActive) {
      throw new NotFoundError("Invite not found.");
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new NotFoundError("Invite not found.");
    }

    const board = invite.board;

    if (board.ownerId === userId) {
      throw new ConflictError("Board owner cannot accept an invite.");
    }

    const existingMembership = await collaboratorRepository.findByBoardAndUser(
      board.id,
      userId
    );

    if (existingMembership) {
      throw new ConflictError("You are already a collaborator on this board.");
    }

    const accepted = await prisma.$transaction(async (transaction) => {
      const collaborator = await transaction.collaborator.create({
        data: {
          boardId: board.id,
          userId,
          role: invite.role,
        },
      });

      const shouldDeactivate =
        invite.maxUses !== null && invite.uses + 1 >= invite.maxUses;

      await transaction.invite.update({
        where: {
          id: invite.id,
        },
        data: {
          uses: {
            increment: 1,
          },
          isActive: shouldDeactivate ? false : invite.isActive,
        },
      });

      return collaborator;
    });

    return {
      board,
      membership: accepted,
    };
  }
}

export const inviteService = new InviteService();