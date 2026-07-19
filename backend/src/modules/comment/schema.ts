import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  shapeId: z.string().optional(),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const resolveCommentSchema = z.object({
  resolved: z.boolean(),
});

export type CreateCommentDto = z.infer<typeof createCommentSchema>;
export type UpdateCommentDto = z.infer<typeof updateCommentSchema>;
export type ResolveCommentDto = z.infer<typeof resolveCommentSchema>;
