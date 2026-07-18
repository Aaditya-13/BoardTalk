import type { AuthUser } from "../modules/user/types.js";

declare global {
  namespace Express {
    interface User extends AuthUser {}

    interface Request {
      user?: User;
    }
  }
}

export {};