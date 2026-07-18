import type {
  Prisma,
  User,
} from "../../generated/prisma/client.js";

import { authRepository } from "./repository.js";
import type {
  AuthResult,
  JwtPayload,
  OAuthProfile,
} from "./types.js";

import { userRepository } from "../user/repository.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from "../../utils/jwt.js";

import { hashToken } from "../../utils/hash.js";

import {
  NotFoundError,
  UnauthorizedError,
} from "../shared/errors.js";

class AuthService {
  private async findOrCreateOAuthUser(
    profile: OAuthProfile
  ): Promise<User> {
    const existingUser =
      await userRepository.findByProvider(
        profile.provider,
        profile.providerId
      );

    if (existingUser) {
      return existingUser;
    }

    const data: Prisma.UserCreateInput = {
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      providerId: profile.providerId,
    };

    return userRepository.create(data);
  }

  async login(
    profile: OAuthProfile
  ): Promise<AuthResult> {
    const user =
      await this.findOrCreateOAuthUser(profile);

    const payload: JwtPayload = {
      userId: user.id,
    };

    const accessToken =
      generateAccessToken(payload);

    const refreshToken =
      generateRefreshToken(payload);

    const tokenHash =
      hashToken(refreshToken);

await authRepository.createRefreshToken(
  user.id,
  tokenHash,
  getRefreshTokenExpiry()
);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refresh(
    refreshToken: string
  ): Promise<AuthResult> {
    const tokenHash =
      hashToken(refreshToken);

    const storedToken =
      await authRepository.findActiveRefreshToken(
        tokenHash
      );

    if (!storedToken) {
      throw new UnauthorizedError(
        "Invalid refresh token."
      );
    }

    const payload =
      verifyRefreshToken(refreshToken);

    await authRepository.revokeRefreshToken(
      tokenHash
    );

    const newAccessToken =
      generateAccessToken({
        userId: payload.userId,
      });

    const newRefreshToken =
      generateRefreshToken({
        userId: payload.userId,
      });

    const newTokenHash =
      hashToken(newRefreshToken);


    await authRepository.createRefreshToken(
      payload.userId,
      newTokenHash,
      getRefreshTokenExpiry()
    );

    return {
      user: storedToken.user,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async logout(
    refreshToken: string
  ): Promise<void> {
    const tokenHash =
      hashToken(refreshToken);

    const storedToken =
      await authRepository.findActiveRefreshToken(
        tokenHash
      );

    if (!storedToken) {
      throw new NotFoundError(
        "Refresh token not found."
      );
    }

    await authRepository.revokeRefreshToken(
      tokenHash
    );
  }
}

export const authService =
  new AuthService();