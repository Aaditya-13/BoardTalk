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
