// next.config.ts
// Next.js configuration — externalize pg/Prisma on the server; Turbopack browser fallbacks for safety.

import type { NextConfig } from "next";
import path from "node:path";

const nodeBuiltinAliases = {
  dns: path.join(__dirname, "src/lib/empty-node-module.ts"),
  fs: path.join(__dirname, "src/lib/empty-node-module.ts"),
  net: path.join(__dirname, "src/lib/empty-node-module.ts"),
  tls: path.join(__dirname, "src/lib/empty-node-module.ts"),
  "node:dns": path.join(__dirname, "src/lib/empty-node-module.ts"),
  "node:fs": path.join(__dirname, "src/lib/empty-node-module.ts"),
  "node:net": path.join(__dirname, "src/lib/empty-node-module.ts"),
  "node:tls": path.join(__dirname, "src/lib/empty-node-module.ts"),
};

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pg",
    "pg-native",
    "pg-connection-string",
    "pg-pool",
    "pgpass",
    "@prisma/adapter-pg",
    "@prisma/client",
    "@prisma/driver-adapter-utils",
    "prisma",
    "openai",
    "@tavily/core",
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve ??= {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },

  turbopack: {
    resolveAlias: Object.fromEntries(
      Object.entries(nodeBuiltinAliases).map(([key, value]) => [
        key,
        { browser: value },
      ])
    ),
  },
};

export default nextConfig;
