import type { Request, Response } from "express";

import { boardService } from "./service.js";

class BoardController {
  async createBoard(req: Request, res: Response) {
    const board = await boardService.createBoard(req.user!.id, req.body);

    return res.status(201).json({
      success: true,
      data: board,
    });
  }
}

export const boardController = new BoardController();