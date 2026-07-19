import { collaboratorService } from "../collaborator/service.js";

import { chatRepository } from "./repository.js";
import type { ChatHistoryQueryDto } from "./schema.js";

class ChatService {
  async sendMessage(boardId: string, userId: string, content: string) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    return chatRepository.create({
      board: { connect: { id: boardId } },
      author: { connect: { id: userId } },
      content,
    });
  }

  async getHistory(
    boardId: string,
    userId: string,
    query: ChatHistoryQueryDto
  ) {
    await collaboratorService.assertBoardAccess(boardId, userId);

    const before = query.before ? new Date(query.before) : undefined;

    // findMany returns newest-first for pagination; reverse for chronological display
    const messages = await chatRepository.findManyByBoardId(
      boardId,
      before,
      query.limit
    );

    return messages.reverse();
  }
}

export const chatService = new ChatService();
