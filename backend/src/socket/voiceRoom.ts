export interface VoiceParticipant {
  userId: string;
  socketId: string;
  muted: boolean;
}

const voiceRooms = new Map<string, Map<string, VoiceParticipant>>();

function getRoom(boardId: string) {
  return voiceRooms.get(boardId) ?? new Map<string, VoiceParticipant>();
}

export function joinVoiceRoom(
  boardId: string,
  userId: string,
  socketId: string
): VoiceParticipant[] {
  const room = getRoom(boardId);
  const participant: VoiceParticipant = { userId, socketId, muted: false };
  room.set(userId, participant);
  voiceRooms.set(boardId, room);
  return Array.from(room.values());
}

export function leaveVoiceRoom(
  boardId: string,
  userId: string
): VoiceParticipant[] {
  const room = voiceRooms.get(boardId);
  if (!room) return [];
  room.delete(userId);
  if (room.size === 0) {
    voiceRooms.delete(boardId);
    return [];
  }
  return Array.from(room.values());
}

export function setMuteStatus(
  boardId: string,
  userId: string,
  muted: boolean
): VoiceParticipant | null {
  const room = voiceRooms.get(boardId);
  if (!room) return null;
  const participant = room.get(userId);
  if (!participant) return null;
  participant.muted = muted;
  room.set(userId, participant);
  return participant;
}

export function getParticipantSocketId(
  boardId: string,
  userId: string
): string | null {
  const room = voiceRooms.get(boardId);
  if (!room) return null;
  const participant = room.get(userId);
  return participant ? participant.socketId : null;
}

export function leaveVoiceRoomBySocketId(socketId: string) {
  for (const [boardId, room] of voiceRooms.entries()) {
    for (const [userId, participant] of room.entries()) {
      if (participant.socketId === socketId) {
        room.delete(userId);
        if (room.size === 0) {
          voiceRooms.delete(boardId);
        }
        return { boardId, userId, participants: Array.from(room.values()) };
      }
    }
  }
  return null;
}
