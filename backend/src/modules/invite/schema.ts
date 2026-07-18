import { z } from "zod";

import { CollaboratorRole } from "../../generated/prisma/client.js";

export const createInviteSchema = z.object({
  role: z.nativeEnum(CollaboratorRole),

  maxUses: z
    .number()
    .int("Maximum uses must be an integer.")
    .positive("Maximum uses must be greater than 0.")
    .nullable()
    .optional(),

  expiresAt: z.coerce.date().nullable().optional(),
});

export type CreateInviteDto = z.infer<typeof createInviteSchema>;