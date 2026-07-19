import type { Request, Response } from "express";

import { commentService } from "./service.js";

class CommentController {
  async listComments(req: Request, res: Response) {
    const shapeId = req.query.shapeId as string | undefined;
    const comments = await commentService.listComments(
      req.params.boardId as string,
      req.user!.id,
      shapeId
    );

    return res.status(200).json({ success: true, data: comments });
  }

  async createComment(req: Request, res: Response) {
    const comment = await commentService.createComment(
      req.params.boardId as string,
      req.user!.id,
      req.body
    );

    return res.status(201).json({ success: true, data: comment });
  }

  async updateComment(req: Request, res: Response) {
    const comment = await commentService.updateComment(
      req.params.commentId as string,
      req.user!.id,
      req.body
    );

    return res.status(200).json({ success: true, data: comment });
  }

  async resolveComment(req: Request, res: Response) {
    const comment = await commentService.resolveComment(
      req.params.commentId as string,
      req.user!.id,
      req.body
    );

    return res.status(200).json({ success: true, data: comment });
  }

  async deleteComment(req: Request, res: Response) {
    await commentService.deleteComment(
      req.params.commentId as string,
      req.user!.id
    );

    return res.status(204).send();
  }
}

export const commentController = new CommentController();
