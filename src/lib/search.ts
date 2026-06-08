// src/lib/search.ts
// Tavily search client for CodeLife Outreach.
// Reads API key from DB first (set via Settings UI), falls back to env.

import { tavily } from "@tavily/core";
import { prisma } from "@/src/lib/db";

// Get active search config — DB first, then env fallback
export async function getSearchConfig() {
  try {
    const dbConfig = await prisma.searchConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (dbConfig) {
      return {
        apiKey: dbConfig.apiKey,
        provider: dbConfig.provider,
      };
    }
  } catch {
    // DB not available — fall back to env
  }

  return {
    apiKey: process.env.TAVILY_API_KEY ?? "",
    provider: "tavily",
  };
}

// Create search client with current config
export async function createSearchClient() {
  const config = await getSearchConfig();

  if (!config.apiKey) {
    throw new Error(
      "No search API key configured. Please set one in Settings or add TAVILY_API_KEY to .env"
    );
  }

  return tavily({ apiKey: config.apiKey });
}

// Reusable search helper
export async function searchWeb(
  query: string,
  options?: {
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
  }
) {
  const client = await createSearchClient();

  const results = await client.search(query, {
    maxResults: options?.maxResults ?? 5,
    searchDepth: options?.searchDepth ?? "basic",
  });

  return results.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));
}