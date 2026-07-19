import { z } from "zod";

import { BoardVisibility } from "../../generated/prisma/client.js";

export const createBoardSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters.")
    .max(120, "Title cannot exceed 120 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .nullable()
    .optional(),

  visibility: z.nativeEnum(BoardVisibility).optional(),
  canvasColor: z.string().nullable().optional(),
});

export const updateBoardSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters.")
      .max(120, "Title cannot exceed 120 characters.")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters.")
      .nullable()
      .optional(),

    visibility: z.nativeEnum(BoardVisibility).optional(),
    canvasColor: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.visibility !== undefined ||
      data.canvasColor !== undefined,
    {
      message: "At least one board field must be provided.",
    }
  );

export type CreateBoardDto = z.infer<typeof createBoardSchema>;
export type UpdateBoardDto = z.infer<typeof updateBoardSchema>;