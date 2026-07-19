import type { Response } from "express";

import { env } from "../config/env.js";
import type { TokenPair } from "../modules/auth/types.js";

const isProduction = env.NODE_ENV === "production";

export function setAuthCookies(
  res: Response,
  tokens: TokenPair
): void {
  res.cookie("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  if (tokens.refreshToken) {
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("accessToken");

  res.clearCookie("refreshToken");
}