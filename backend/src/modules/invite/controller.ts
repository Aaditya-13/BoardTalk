import type { Request, Response } from "express";

import { inviteService } from "./service.js";

class InviteController {
  async createInvite(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const invite = await inviteService.createInvite(
      req.user!.id,
      boardId,
      req.body
    );

    return res.status(201).json({
      success: true,
      data: invite,
    });
  }

  async listInvites(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const invites = await inviteService.listInvites(req.user!.id, boardId);

    return res.status(200).json({
      success: true,
      data: invites,
    });
  }

  async revokeInvite(req: Request, res: Response) {
    const boardId = req.params.boardId as string;
    const inviteId = req.params.inviteId as string;

    const invite = await inviteService.revokeInvite(
      req.user!.id,
      boardId,
      inviteId
    );

    return res.status(200).json({
      success: true,
      data: invite,
    });
  }
}

export const inviteController = new InviteController();