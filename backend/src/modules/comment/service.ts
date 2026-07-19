import { Prisma } from "../../generated/prisma/client.js";
import { boardRepository } from "../board/repository.js";
import { collaboratorService } from "../collaborator/service.js";
import { ForbiddenError, NotFoundError } from "../shared/errors.js";

import { commentRepository } from "./repository.js";
import type {
  CreateCommentDto,
  UpdateCommentDto,
  ResolveCommentDto,
} from "./schema.js";

class CommentService {
  async listComments(boardId: string, userId: string, shapeId?: string) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    return commentRepository.findManyByBoardId(boardId, shapeId);
  }

  async createComment(
    boardId: string,
    userId: string,
    dto: CreateCommentDto
  ) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    return commentRepository.create({
      board: { connect: { id: boardId } },
      author: { connect: { id: userId } },
      content: dto.content,
      position: dto.position ?? Prisma.JsonNull,
      shapeId: dto.shapeId ?? null,
    });
  }

  async updateComment(
    commentId: string,
    userId: string,
    dto: UpdateCommentDto
  ) {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError("Comment not found.");
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenError("You can only edit your own comments.");
    }

    return commentRepository.update(commentId, {
      content: dto.content,
    });
  }

  async resolveComment(
    commentId: string,
    userId: string,
    dto: ResolveCommentDto
  ) {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError("Comment not found.");
    }

    // Author or board owner can resolve/reopen
    if (comment.authorId !== userId) {
      const board = await boardRepository.findById(comment.boardId);

      if (!board || board.ownerId !== userId) {
        throw new ForbiddenError(
          "Only the comment author or board owner can resolve this comment."
        );
      }
    }

    return commentRepository.update(commentId, {
      resolved: dto.resolved,
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
      throw new NotFoundError("Comment not found.");
    }

    // Author or board owner can delete
    if (comment.authorId !== userId) {
      const board = await boardRepository.findById(comment.boardId);

      if (!board || board.ownerId !== userId) {
        throw new ForbiddenError(
          "Only the comment author or board owner can delete this comment."
        );
      }
    }

    return commentRepository.deleteById(commentId);
  }
}

export const commentService = new CommentService();
