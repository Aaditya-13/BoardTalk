import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters.")
    .optional(),

  avatarUrl: z
    .url("Avatar URL must be a valid URL.")
    .nullable()
    .optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;