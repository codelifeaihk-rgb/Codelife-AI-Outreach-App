// prisma.config.ts
// Prisma 7 requires datasource URL here, not in schema.prisma

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "postgresql://postgres.hbultcuulsnjgvojbmiw:codelifeaiadmin@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
  },
});