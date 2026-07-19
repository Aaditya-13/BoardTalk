import { config } from "dotenv";
import { z } from "zod";

// Load .env into process.env
config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),

  JWT_ACCESS_EXPIRES_IN: z.string().min(1),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1),

  TOKEN_HASH_SECRET: z.string().min(1),

  GOOGLE_CLIENT_ID: z.string().min(1),

  GOOGLE_CLIENT_SECRET: z.string().min(1),

  GITHUB_CLIENT_ID: z.string().min(1),

  GITHUB_CLIENT_SECRET: z.string().min(1),

  CLIENT_URL: z.string().url(),

  GEMINI_API_KEY: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;