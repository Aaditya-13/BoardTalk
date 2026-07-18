import type { Request, Response } from "express";

import { inviteService } from "./service.js";

class PublicInviteController {
  async acceptInvite(req: Request, res: Response) {
    const result = await inviteService.acceptInvite(
      req.user!.id,
      req.body.token
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}

export const publicInviteController = new PublicInviteController();