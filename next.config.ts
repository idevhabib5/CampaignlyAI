import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure the seeded SQLite file is included in Vercel serverless bundles
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db", "./prisma/schema.prisma"],
  },
  serverExternalPackages: ["@prisma/client", "prisma", "bcryptjs"],
};

export default nextConfig;
