import type { Request, Response } from "express";

import { collaboratorService } from "./service.js";

class CollaboratorController {
  async getMyMembership(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const membership = await collaboratorService.getMembership(
      boardId,
      req.user!.id
    );

    return res.status(200).json({
      success: true,
      data: membership,
    });
  }

  async listCollaborators(req: Request, res: Response) {
    const boardId = req.params.boardId as string;

    const collaborators = await collaboratorService.listCollaborators(
      req.user!.id,
      boardId
    );

    return res.status(200).json({
      success: true,
      data: collaborators,
    });
  }

  async updateCollaboratorRole(req: Request, res: Response) {
    const boardId = req.params.boardId as string;
    const collaboratorId = req.params.collaboratorId as string;

    const collaborator = await collaboratorService.updateCollaboratorRole(
      req.user!.id,
      boardId,
      collaboratorId,
      req.body.role
    );

    return res.status(200).json({
      success: true,
      data: collaborator,
    });
  }

  async removeCollaborator(req: Request, res: Response) {
    const boardId = req.params.boardId as string;
    const collaboratorId = req.params.collaboratorId as string;

    await collaboratorService.removeCollaborator(
      req.user!.id,
      boardId,
      collaboratorId
    );

    return res.status(204).send();
  }
}

export const collaboratorController = new CollaboratorController();