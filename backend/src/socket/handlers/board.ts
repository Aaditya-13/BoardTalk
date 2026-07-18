import type { Socket } from "socket.io";

import { collaboratorService } from "../../modules/collaborator/service.js";
import {
  getBoardRoomName,
  joinBoardRoom,
  leaveBoardRoom,
} from "../rooms.js";
import {
  removePresence,
  upsertPresence,
  updateCursor,
  updateSelection,
} from "../presence.js";

type JoinBoardPayload = {
  boardId: string;
};

type CursorPayload = {
  boardId: string;
  x: number;
  y: number;
};

type SelectionPayload = {
  boardId: string;
  ids: string[];
};

export function registerBoardSocketHandlers(socket: Socket) {
  socket.on(
    "board:join",
    async (
      payload: JoinBoardPayload,
      acknowledge?: (response: {
        success: boolean;
        data?: { boardId: string; role: string };
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

        socket.emit("board:presence:snapshot", {
          boardId: payload.boardId,
          members: presence,
        });

        socket.to(getBoardRoomName(payload.boardId)).emit("board:presence:joined", {
          boardId: payload.boardId,
          member: {
            userId: socket.data.user.id,
            email: socket.data.user.email,
            role,
          },
        });

        acknowledge?.({
          success: true,
          data: {
            boardId: payload.boardId,
            role,
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

  socket.on("board:cursor", (payload: CursorPayload) => {
    const member = updateCursor(payload.boardId, socket.data.user.id, {
      x: payload.x,
      y: payload.y,
    });

    if (!member) {
      return;
    }

    socket.to(getBoardRoomName(payload.boardId)).emit("board:cursor", {
      boardId: payload.boardId,
      member,
    });
  });

  socket.on("board:selection", (payload: SelectionPayload) => {
    const member = updateSelection(payload.boardId, socket.data.user.id, {
      ids: payload.ids,
    });

    if (!member) {
      return;
    }

    socket.to(getBoardRoomName(payload.boardId)).emit("board:selection", {
      boardId: payload.boardId,
      member,
    });
  });

  socket.on("disconnecting", () => {
    for (const roomName of socket.rooms) {
      if (roomName.startsWith("board:")) {
        removePresence(roomName.slice("board:".length), socket.data.user.id);
        leaveBoardRoom(roomName.slice("board:".length), socket.id);
      }
    }
  });
}