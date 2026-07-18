import type { Request, Response } from "express";

import { snapshotService } from "./service.js";

class SnapshotController {
  async getLatestSnapshot(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const snapshot = await snapshotService.getLatestSnapshot(
      boardId,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      data: snapshot,
    });
  }

  async saveSnapshot(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const snapshot = await snapshotService.saveSnapshot(
      boardId,
      req.user!.id,
      req.body.documentJson
    );

    return res.status(201).json({
      success: true,
      data: snapshot,
    });
  }
}

export const snapshotController = new SnapshotController();