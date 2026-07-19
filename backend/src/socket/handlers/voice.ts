import type { Server, Socket } from "socket.io";
import {
  joinVoiceRoom,
  leaveVoiceRoom,
  setMuteStatus,
  getParticipantSocketId,
  leaveVoiceRoomBySocketId,
} from "../voiceRoom.js";

export function registerVoiceSocketHandlers(io: Server, socket: Socket) {
  socket.on("voice:join", (payload: { boardId: string }) => {
    const participants = joinVoiceRoom(
      payload.boardId,
      socket.data.user.id,
      socket.id
    );

    const voiceRoomName = `voice:${payload.boardId}`;
    socket.join(voiceRoomName);

    io.to(voiceRoomName).emit("voice:joined", {
      boardId: payload.boardId,
      userId: socket.data.user.id,
      participants,
    });
  });

  socket.on("voice:leave", (payload: { boardId: string }) => {
    const voiceRoomName = `voice:${payload.boardId}`;
    const participants = leaveVoiceRoom(payload.boardId, socket.data.user.id);
    socket.leave(voiceRoomName);

    io.to(voiceRoomName).emit("voice:left", {
      boardId: payload.boardId,
      userId: socket.data.user.id,
      participants,
    });
  });

  socket.on("voice:mute", (payload: { boardId: string; muted: boolean }) => {
    const voiceRoomName = `voice:${payload.boardId}`;
    setMuteStatus(payload.boardId, socket.data.user.id, payload.muted);

    io.to(voiceRoomName).emit("voice:mute", {
      boardId: payload.boardId,
      userId: socket.data.user.id,
      muted: payload.muted,
    });
  });

  socket.on(
    "voice:offer",
    (payload: { boardId: string; targetUserId: string; sdp: any }) => {
      const targetSocketId = getParticipantSocketId(
        payload.boardId,
        payload.targetUserId
      );
      if (targetSocketId) {
        io.to(targetSocketId).emit("voice:offer", {
          boardId: payload.boardId,
          fromUserId: socket.data.user.id,
          sdp: payload.sdp,
        });
      }
    }
  );

  socket.on(
    "voice:answer",
    (payload: { boardId: string; targetUserId: string; sdp: any }) => {
      const targetSocketId = getParticipantSocketId(
        payload.boardId,
        payload.targetUserId
      );
      if (targetSocketId) {
        io.to(targetSocketId).emit("voice:answer", {
          boardId: payload.boardId,
          fromUserId: socket.data.user.id,
          sdp: payload.sdp,
        });
      }
    }
  );

  socket.on(
    "voice:ice-candidate",
    (payload: { boardId: string; targetUserId: string; candidate: any }) => {
      const targetSocketId = getParticipantSocketId(
        payload.boardId,
        payload.targetUserId
      );
      if (targetSocketId) {
        io.to(targetSocketId).emit("voice:ice-candidate", {
          boardId: payload.boardId,
          fromUserId: socket.data.user.id,
          candidate: payload.candidate,
        });
      }
    }
  );

  socket.on("disconnect", () => {
    const result = leaveVoiceRoomBySocketId(socket.id);
    if (result) {
      const voiceRoomName = `voice:${result.boardId}`;
      io.to(voiceRoomName).emit("voice:left", {
        boardId: result.boardId,
        userId: result.userId,
        participants: result.participants,
      });
    }
  });
}
