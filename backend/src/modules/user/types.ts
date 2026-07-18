import type { AuthProvider } from "../../generated/prisma/client.js";

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
}