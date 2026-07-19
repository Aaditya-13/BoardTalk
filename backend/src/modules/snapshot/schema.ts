import { z } from "zod";

export const saveSnapshotSchema = z.object({
  documentJson: z.unknown(),
});

export const restoreSnapshotParamsSchema = z.object({
  version: z.coerce.number().int().positive(),
});

export const compareSnapshotQuerySchema = z.object({
  fromVersion: z.coerce.number().int().positive(),
  toVersion: z.coerce.number().int().positive(),
});

export type SaveSnapshotDto = z.infer<typeof saveSnapshotSchema>;
export type RestoreSnapshotParamsDto = z.infer<
  typeof restoreSnapshotParamsSchema
>;
export type CompareSnapshotQueryDto = z.infer<
  typeof compareSnapshotQuerySchema
>;