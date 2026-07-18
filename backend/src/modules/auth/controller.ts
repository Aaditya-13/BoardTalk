import type { Request, Response } from "express";

import { env } from "../../config/env.js";

import { BadRequestError } from "../shared/errors.js";

import { clearAuthCookies, setAuthCookies } from "../../utils/cookies.js";

import { authService } from "./service.js";
import type { OAuthProfile } from "./types.js";

class AuthController {
  async googleCallback(
    req: Request,
    res: Response
  ) {
    const profile = req.user as unknown as OAuthProfile;

    const result = await authService.login(profile);

    setAuthCookies(res, result.tokens);

    res.redirect(env.CLIENT_URL);
  }

  async githubCallback(
    req: Request,
    res: Response
  ) {
    const profile = req.user as unknown as OAuthProfile;

    const result = await authService.login(profile);

    setAuthCookies(res, result.tokens);

    res.redirect(env.CLIENT_URL);
  }

  async refresh(
    req: Request,
    res: Response
  ) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      throw new BadRequestError(
        "Refresh token is missing."
      );
    }

    const result =
      await authService.refresh(refreshToken);

    setAuthCookies(res, result.tokens);

    res.status(200).json({
      success: true,
      data: result.user,
    });
  }

  async logout(
    req: Request,
    res: Response
  ) {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    clearAuthCookies(res);

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  }
}

export const authController = new AuthController();