import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../modules/shared/errors.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { userRepository } from "../modules/user/repository.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  if (!authHeader?.startsWith("Bearer ") && !cookieToken) {
    throw new UnauthorizedError("Authentication required.");
  }

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : cookieToken;

  const payload = verifyAccessToken(token);

  const user = await userRepository.findById(payload.userId);

  if (!user) {
    throw new UnauthorizedError("User no longer exists.");
  }

  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
  };

  next();
}