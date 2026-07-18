import type { AuthUser } from "../modules/user/types.js";

import type { CollaboratorRole } from "../generated/prisma/client.js";

export interface BoardPresenceMember {
  userId: string;
  email: string;
  role: CollaboratorRole;
  cursor?: CursorState;
  selection?: SelectionState;
}

export interface CursorState {
  x: number;
  y: number;
}

export interface SelectionState {
  ids: string[];
}

const boardPresence = new Map<string, Map<string, BoardPresenceMember>>();

function getMembers(boardId: string) {
  return boardPresence.get(boardId) ?? new Map<string, BoardPresenceMember>();
}

export function upsertPresence(
  boardId: string,
  user: AuthUser,
  role: CollaboratorRole
): BoardPresenceMember[] {
  const members = getMembers(boardId);
  const member: BoardPresenceMember = {
    userId: user.id,
    email: user.email,
    role,
  };

  members.set(user.id, member);
  boardPresence.set(boardId, members);

  return Array.from(members.values());
}

export function removePresence(boardId: string, userId: string): BoardPresenceMember[] {
  const members = boardPresence.get(boardId);

  if (!members) {
    return [];
  }

  members.delete(userId);

  if (members.size === 0) {
    boardPresence.delete(boardId);
    return [];
  }

  return Array.from(members.values());
}

export function updateCursor(
  boardId: string,
  userId: string,
  cursor: CursorState
): BoardPresenceMember | null {
  const members = boardPresence.get(boardId);

  if (!members) {
    return null;
  }

  const member = members.get(userId);

  if (!member) {
    return null;
  }

  member.cursor = cursor;
  members.set(userId, member);

  return member;
}

export function updateSelection(
  boardId: string,
  userId: string,
  selection: SelectionState
): BoardPresenceMember | null {
  const members = boardPresence.get(boardId);

  if (!members) {
    return null;
  }

  const member = members.get(userId);

  if (!member) {
    return null;
  }

  member.selection = selection;
  members.set(userId, member);

  return member;
}