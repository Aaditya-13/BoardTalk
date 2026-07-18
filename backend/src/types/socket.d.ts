import type { AuthUser } from "../modules/user/types.js";

declare module "socket.io" {
  interface SocketData {
    user: AuthUser;
  }
}

export {};