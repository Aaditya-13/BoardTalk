import type { AuthUser } from "../modules/user/types.js";

import type { CollaboratorRole } from "../generated/prisma/client.js";

export interface BoardPresenceMember {
  userId: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  role: CollaboratorRole;
  ephemeralState?: any;
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
    name: user.name,
    avatarUrl: user.avatarUrl,
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

export function updateEphemeralState(
  boardId: string,
  userId: string,
  state: any
): BoardPresenceMember | null {
  const members = boardPresence.get(boardId);

  if (!members) {
    return null;
  }

  const member = members.get(userId);

  if (!member) {
    return null;
  }

  member.ephemeralState = state;
  members.set(userId, member);

  return member;
}