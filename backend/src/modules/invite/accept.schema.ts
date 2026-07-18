import { z } from "zod";

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, "Invite token is required."),
});

export type AcceptInviteDto = z.infer<typeof acceptInviteSchema>;