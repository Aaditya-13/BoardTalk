import { randomUUID } from "node:crypto";
import { logger } from "../../lib/logger.js";

import type { Server as SocketIOServer, Socket } from "socket.io";

import { collaboratorService } from "../../modules/collaborator/service.js";
import { snapshotService } from "../../modules/snapshot/service.js";
import { chatService } from "../../modules/chat/service.js";
import { aiService } from "../../modules/ai/service.js";
import {
  getBoardRoomName,
  joinBoardRoom,
  leaveBoardRoom,
} from "../rooms.js";
import {
  removePresence,
  upsertPresence,
  updateEphemeralState,
} from "../presence.js";
import {
  flushSnapshot,
  persistSnapshot,
  queueSnapshot,
} from "../snapshotBuffer.js";
import { applyYjsUpdate, getSyncStep2, clearDocIfEmpty, hasActiveDoc } from "../yjs.js";

const AI_PREFIX = "/ai ";

type JoinBoardPayload = {
  boardId: string;
};

type EphemeralPayload = {
  boardId: string;
  state: any;
};

type DocumentPayload = {
  boardId: string;
  documentJson: unknown;
};

type ChatMessagePayload = {
  boardId: string;
  content: string;
};

export function registerBoardSocketHandlers(
  io: SocketIOServer,
  socket: Socket
) {
  socket.on(
    "board:join",
    async (
      payload: JoinBoardPayload,
      acknowledge?: (response: {
        success: boolean;
        data?: { boardId: string; role: string; isMemoryActive?: boolean };
        message?: string;
      }) => void
    ) => {
      try {
        const role = await collaboratorService.assertBoardAccess(
          payload.boardId,
          socket.data.user.id
        );

        const presence = upsertPresence(
          payload.boardId,
          socket.data.user,
          role
        );

        socket.join(getBoardRoomName(payload.boardId));
        joinBoardRoom(payload.boardId, socket.id);
        logger.info(`Room joined: ${payload.boardId} by ${socket.data.user.id}`);

        socket.emit("board:presence:snapshot", {
          boardId: payload.boardId,
          members: presence,
        });

        try {
          const snapshot = await snapshotService.getLatestSnapshot(
            payload.boardId,
            socket.data.user.id
          );

          socket.emit("board:snapshot:latest", {
            boardId: payload.boardId,
            snapshot,
          });
        } catch {
          socket.emit("board:snapshot:latest", {
            boardId: payload.boardId,
            snapshot: null,
          });
        }

        // Send last 50 chat messages to the joining member
        try {
          const history = await chatService.getHistory(
            payload.boardId,
            socket.data.user.id,
            { limit: 50 }
          );

          socket.emit("chat:history", {
            boardId: payload.boardId,
            messages: history,
          });
        } catch {
          // non-fatal — chat history is best-effort
        }

        socket.to(getBoardRoomName(payload.boardId)).emit("board:presence:joined", {
          boardId: payload.boardId,
          member: {
            userId: socket.data.user.id,
            email: socket.data.user.email,
            name: socket.data.user.name,
            avatarUrl: socket.data.user.avatarUrl,
            role,
          },
        });

        acknowledge?.({
          success: true,
          data: {
            boardId: payload.boardId,
            role,
            isMemoryActive: hasActiveDoc(payload.boardId)
          },
        });
      } catch (error) {
        acknowledge?.({
          success: false,
          message:
            error instanceof Error ? error.message : "Unable to join board room.",
        });
      }
    }
  );

  socket.on("board:leave", (payload: JoinBoardPayload) => {
    const members = removePresence(payload.boardId, socket.data.user.id);

    socket.leave(getBoardRoomName(payload.boardId));
    leaveBoardRoom(payload.boardId, socket.id);

    socket.to(getBoardRoomName(payload.boardId)).emit("board:presence:left", {
      boardId: payload.boardId,
      userId: socket.data.user.id,
      members,
    });
  });

  socket.on("board:ephemeral", (payload: EphemeralPayload) => {
    const member = updateEphemeralState(payload.boardId, socket.data.user.id, payload.state);

    if (!member) {
      return;
    }

    socket.to(getBoardRoomName(payload.boardId)).emit("board:ephemeral", {
      boardId: payload.boardId,
      member,
    });
  });

  socket.on("board:update", (payload: { boardId: string; update: any }) => {
    socket.to(getBoardRoomName(payload.boardId)).emit("board:update", {
      boardId: payload.boardId,
      update: payload.update,
    });
  });

  socket.on("board:yjs:sync-step-1", (payload: { boardId: string; stateVector: ArrayBuffer | Uint8Array }) => {
    const update = getSyncStep2(payload.boardId, Buffer.from(payload.stateVector as ArrayBuffer));
    socket.emit("board:yjs:sync-step-2", {
      boardId: payload.boardId,
      update: update,
    });
  });

  socket.on("board:yjs:update", (payload: { boardId: string; update: ArrayBuffer | Uint8Array }) => {
    applyYjsUpdate(payload.boardId, Buffer.from(payload.update as ArrayBuffer));
    socket.to(getBoardRoomName(payload.boardId)).emit("board:yjs:update", {
      boardId: payload.boardId,
      update: payload.update,
    });
  });

  socket.on("board:document", (payload: DocumentPayload) => {
    queueSnapshot(
      payload.boardId,
      socket.data.user.id,
      payload.documentJson,
      persistSnapshot
    );
  });

  socket.on("board:snapshot:flush", async (payload: JoinBoardPayload) => {
    await flushSnapshot(payload.boardId, socket.data.user.id, persistSnapshot);
  });

  socket.on("chat:message", async (payload: ChatMessagePayload) => {
    try {
      const message = await chatService.sendMessage(
        payload.boardId,
        socket.data.user.id,
        payload.content
      );

      // Broadcast the persisted message to everyone in the room (including sender)
      io.to(getBoardRoomName(payload.boardId)).emit("chat:message", {
        boardId: payload.boardId,
        message,
      });

      // AI command routing — only if content starts with "/ai "
      if (payload.content.startsWith(AI_PREFIX)) {
        const rawCommand = payload.content.slice(AI_PREFIX.length).trim();
        const requestId = randomUUID();

        // Ack immediately so the client can show a spinner
        socket.emit("ai:generating", {
          boardId: payload.boardId,
          requestId,
        });

        try {
          const result = await aiService.handleCommand(
            payload.boardId,
            socket.data.user.id,
            rawCommand
          );

          socket.emit("ai:result", {
            boardId: payload.boardId,
            requestId,
            elements: result.elements,
          });
        } catch (aiError) {
          socket.emit("ai:error", {
            boardId: payload.boardId,
            requestId,
            message:
              aiError instanceof Error
                ? aiError.message
                : "AI generation failed.",
          });
        }
      }
    } catch (error) {
      socket.emit("chat:error", {
        boardId: payload.boardId,
        message:
          error instanceof Error ? error.message : "Failed to send message.",
      });
    }
  });

  socket.on("disconnecting", () => {
    for (const roomName of socket.rooms) {
      if (roomName.startsWith("board:")) {
        removePresence(roomName.slice("board:".length), socket.data.user.id);
        void flushSnapshot(
          roomName.slice("board:".length),
          socket.data.user.id,
          persistSnapshot
        );
        leaveBoardRoom(roomName.slice("board:".length), socket.id);
      }
    }
  });
}