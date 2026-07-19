import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function normalizeDatabaseUrl(databaseUrl: string): string {
  const url = new URL(databaseUrl);

  if (url.hostname.endsWith(".neon.tech") && !url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }

  return url.toString();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: normalizeDatabaseUrl(env("DATABASE_URL")),
  },
});