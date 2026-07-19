import type { Request, Response } from "express";

import { chatService } from "./service.js";
import { chatHistoryQuerySchema } from "./schema.js";

class ChatController {
  async getHistory(req: Request, res: Response) {
    const query = chatHistoryQuerySchema.parse(req.query);

    const messages = await chatService.getHistory(
      req.params.boardId as string,
      req.user!.id,
      query
    );

    return res.status(200).json({ success: true, data: messages });
  }
}

export const chatController = new ChatController();
