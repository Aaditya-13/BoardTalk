import { z } from "zod";

import { CollaboratorRole } from "../../generated/prisma/client.js";

export const updateCollaboratorRoleSchema = z.object({
  role: z.nativeEnum(CollaboratorRole),
});

export type UpdateCollaboratorRoleDto = z.infer<typeof updateCollaboratorRoleSchema>;