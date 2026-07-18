import type { AuthUser } from "../modules/user/types.js";

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export {};