import type { CollaboratorRole, Invite } from "../../generated/prisma/client.js";

export interface CreateInviteResponse extends Invite {
  role: CollaboratorRole;
}