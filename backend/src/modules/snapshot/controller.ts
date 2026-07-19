import type { Request, Response } from "express";

import {
  compareSnapshotQuerySchema,
  restoreSnapshotParamsSchema,
} from "./schema.js";
import { snapshotService } from "./service.js";

class SnapshotController {
  async listSnapshots(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const snapshots = await snapshotService.listSnapshots(
      boardId,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      data: snapshots,
    });
  }

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

  async compareSnapshots(req: Request, res: Response) {
    const boardId = req.params.boardId as string;
    const { fromVersion, toVersion } = compareSnapshotQuerySchema.parse(
      req.query
    );

    const comparison = await snapshotService.compareSnapshots(
      boardId,
      req.user!.id,
      fromVersion,
      toVersion
    );

    return res.status(200).json({
      success: true,
      data: comparison,
    });
  }

  async restoreSnapshot(req: Request, res: Response) {
    const boardId = req.params.boardId as string;
    const { version } = restoreSnapshotParamsSchema.parse(req.params);

    const snapshot = await snapshotService.restoreSnapshot(
      boardId,
      req.user!.id,
      version
    );

    return res.status(201).json({
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