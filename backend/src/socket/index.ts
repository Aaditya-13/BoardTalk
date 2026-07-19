import type { Server as HttpServer } from "node:http";

import { Server as SocketIOServer } from "socket.io";

import { env } from "../config/env.js";
import { authenticateSocket } from "./middleware.js";
import { registerBoardSocketHandlers } from "./handlers/board.js";
import { registerVoiceSocketHandlers } from "./handlers/voice.js";

export function initializeSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    registerBoardSocketHandlers(io, socket);
    registerVoiceSocketHandlers(io, socket);
  });

  return io;
}