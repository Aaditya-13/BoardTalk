import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env";

function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);

  if (url.hostname.endsWith(".neon.tech") && !url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: normalizeDatabaseUrl(env.DATABASE_URL),
});

export const prisma = new PrismaClient({
  adapter,
});