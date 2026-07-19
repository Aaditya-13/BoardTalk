import type {
  AuthProvider,
  User,
} from "../../generated/prisma/client.js";

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface JwtPayload {
  userId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
}