const boardRoomMembers = new Map<string, Set<string>>();

export function getBoardRoomName(boardId: string): string {
  return `board:${boardId}`;
}

export function joinBoardRoom(boardId: string, socketId: string): void {
  const roomName = getBoardRoomName(boardId);
  const members = boardRoomMembers.get(roomName) ?? new Set<string>();

  members.add(socketId);
  boardRoomMembers.set(roomName, members);
}

export function leaveBoardRoom(boardId: string, socketId: string): void {
  const roomName = getBoardRoomName(boardId);
  const members = boardRoomMembers.get(roomName);

  if (!members) {
    return;
  }

  members.delete(socketId);

  if (members.size === 0) {
    boardRoomMembers.delete(roomName);
    return;
  }

  boardRoomMembers.set(roomName, members);
}