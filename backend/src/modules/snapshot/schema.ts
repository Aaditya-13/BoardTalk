import { z } from "zod";

export const saveSnapshotSchema = z.object({
  documentJson: z.unknown(),
});

export type SaveSnapshotDto = z.infer<typeof saveSnapshotSchema>;