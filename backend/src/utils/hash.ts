import { createHmac } from "node:crypto";

import { env } from "../config/env.js";

export function hashToken(token: string): string {
  return createHmac("sha256", env.TOKEN_HASH_SECRET)
    .update(token)
    .digest("hex");
}