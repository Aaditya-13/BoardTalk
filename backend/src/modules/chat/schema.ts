import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const chatHistoryQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type ChatHistoryQueryDto = z.infer<typeof chatHistoryQuerySchema>;
