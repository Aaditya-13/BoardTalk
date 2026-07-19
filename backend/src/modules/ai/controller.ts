import type { Request, Response } from "express";

import { aiService } from "./service.js";
import { aiCommandSchema } from "./schema.js";

class AiController {
  /**
   * POST /api/v1/boards/:boardId/ai/generate
   * REST fallback — lets the frontend trigger AI generation from a toolbar
   * button rather than the chat socket.
   */
  async generate(req: Request, res: Response) {
    const { command } = aiCommandSchema.parse(req.body);

    const result = await aiService.handleCommand(
      req.params.boardId as string,
      req.user!.id,
      command
    );

    return res.status(200).json({ success: true, data: result });
  }
}

export const aiController = new AiController();
