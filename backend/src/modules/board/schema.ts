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
});

export type CreateBoardDto = z.infer<typeof createBoardSchema>;