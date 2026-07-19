export type AuthProvider = "GOOGLE" | "GITHUB";
export type BoardVisibility = "PRIVATE" | "PUBLIC" | "UNLISTED";
export type CollaboratorRole = "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";

export interface AuthUser {
  id: string;
  isGuest: boolean;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  provider: AuthProvider | null;
}

export interface Board {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  visibility: BoardVisibility;
  ownerId: string;
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
