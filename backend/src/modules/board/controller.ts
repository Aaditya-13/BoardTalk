import type { Request, Response } from "express";

import { boardService } from "./service.js";

class BoardController {
  async listBoards(req: Request, res: Response) {
    const search = req.query.q as string | undefined;
    const boards = await boardService.listBoards(req.user!.id, search);

    return res.status(200).json({
      success: true,
      data: boards,
    });
  }

  async listTrashed(req: Request, res: Response) {
    const boards = await boardService.listTrashed(req.user!.id);
    return res.status(200).json({ success: true, data: boards });
  }

  async listStarred(req: Request, res: Response) {
    const boards = await boardService.listStarred(req.user!.id);
    return res.status(200).json({ success: true, data: boards });
  }

  async createBoard(req: Request, res: Response) {
    const board = await boardService.createBoard(req.user!.id, req.body);

    return res.status(201).json({
      success: true,
      data: board,
    });
  }

  async getBoard(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const board = await boardService.getBoard(
      req.user!.id,
      boardId
    );

    return res.status(200).json({
      success: true,
      data: board,
    });
  }

  async updateBoard(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const board = await boardService.updateBoard(
      req.user!.id,
      boardId,
      req.body
    );

    return res.status(200).json({
      success: true,
      data: board,
    });
  }

  async deleteBoard(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    await boardService.deleteBoard(req.user!.id, boardId);

    return res.status(204).send();
  }

  async toggleStar(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const isStarred = await boardService.toggleStar(req.user!.id, boardId);

    return res.status(200).json({
      success: true,
      data: { isStarred },
    });
  }
}

export const boardController = new BoardController();