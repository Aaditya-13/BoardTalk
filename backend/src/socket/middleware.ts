import type { Socket } from "socket.io";

import { UnauthorizedError } from "../modules/shared/errors.js";
import { userRepository } from "../modules/user/repository.js";
import { verifyAccessToken } from "../utils/jwt.js";

function getCookieValue(cookieHeader: string | undefined, key: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookiePairs = cookieHeader.split(";");

  for (const pair of cookiePairs) {
    const [name, ...valueParts] = pair.trim().split("=");

    if (name === key) {
      return valueParts.join("=");
    }
  }

  return null;
}

export async function authenticateSocket(
  socket: Socket,
  next: (error?: Error) => void
) {
  try {
    const authToken =
      typeof socket.handshake.auth?.token === "string"
        ? socket.handshake.auth.token
        : null;

    const bearerToken = socket.handshake.headers.authorization?.startsWith(
      "Bearer "
    )
      ? socket.handshake.headers.authorization.split(" ")[1]
      : null;

    const cookieToken = getCookieValue(
      socket.handshake.headers.cookie,
      "accessToken"
    );

    const token = authToken ?? bearerToken ?? cookieToken;

    if (!token) {
      throw new UnauthorizedError("Authentication required.");
    }

    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError("User no longer exists.");
    }

    socket.data.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };

    next();
  } catch (error) {
    next(error instanceof Error ? error : new Error("Authentication failed."));
  }
}