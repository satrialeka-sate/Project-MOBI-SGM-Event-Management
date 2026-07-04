import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },

  /**
   * Datasource configuration for Prisma 7.
   * - url: Direct database URL (used for migrations and schema validation).
   * - directUrl: Optional; only needed if a separate direct URL is required.
   *
   * Runtime connections use PrismaClient with adapter (see lib/prisma.ts).
   */
  datasource: {
    url: env("DATABASE_URL"),
  },
});
