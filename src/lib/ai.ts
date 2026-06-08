// src/lib/ai.ts
// AI client for CodeLife Outreach.
// Handles non-standard proxy API responses + GLM thinking output.

import OpenAI from "openai";
import { prisma } from "@/src/lib/db";

export async function getAIConfig() {
  try {
    const dbConfig = await prisma.aiConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    if (dbConfig && dbConfig.apiKey && dbConfig.apiKey !== "") {
      console.log(
        "[AI Config] Using DB config:",
        dbConfig.provider,
        dbConfig.model
      );
      return {
        apiKey: dbConfig.apiKey,
        baseURL: dbConfig.baseUrl,
        model: dbConfig.model,
        provider: dbConfig.provider,
      };
    }
  } catch {
    console.log("[AI Config] DB config not available, using env");
  }

  const config = {
    apiKey: process.env.AI_API_KEY ?? "",
    baseURL:
      process.env.AI_BASE_URL ?? "https://console.pivotbak.cfd/v1",
    model: process.env.AI_MODEL ?? "glm-5.1",
    provider: "glm",
  };

  console.log(
    "[AI Config] Using env config:",
    config.provider,
    config.model,
    config.baseURL
  );
  return config;
}

// Safely extract text content from any API response format
// Handles: standard OpenAI, proxy variants, streaming leftovers
function extractContentFromResponse(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("API returned null or non-object response");
  }

  const r = response as Record<string, unknown>;

  // Log full response structure in dev for debugging
  console.log(
    "[AI] Raw response keys:",
    Object.keys(r)
  );
  console.log(
    "[AI] Raw response (first 500):",
    JSON.stringify(r).slice(0, 500)
  );

  // Format 1: Standard OpenAI — response.choices[0].message.content
  if (Array.isArray(r.choices) && r.choices.length > 0) {
    const choice = r.choices[0] as Record<string, unknown>;
    if (choice.message && typeof choice.message === "object") {
      const msg = choice.message as Record<string, unknown>;
      if (typeof msg.content === "string" && msg.content.trim()) {
        console.log("[AI] Extracted via choices[0].message.content");
        return msg.content;
      }
    }
    // Some proxies put content directly on choice
    if (typeof choice.content === "string" && choice.content.trim()) {
      console.log("[AI] Extracted via choices[0].content");
      return choice.content;
    }
    if (typeof choice.text === "string" && choice.text.trim()) {
      console.log("[AI] Extracted via choices[0].text");
      return choice.text;
    }
  }

  // Format 2: Some proxies return response.content directly
  if (typeof r.content === "string" && r.content.trim()) {
    console.log("[AI] Extracted via response.content");
    return r.content;
  }

  // Format 3: response.text
  if (typeof r.text === "string" && r.text.trim()) {
    console.log("[AI] Extracted via response.text");
    return r.text;
  }

  // Format 4: response.result
  if (typeof r.result === "string" && r.result.trim()) {
    console.log("[AI] Extracted via response.result");
    return r.result;
  }

  // Format 5: response.output.text (some Chinese APIs)
  if (r.output && typeof r.output === "object") {
    const output = r.output as Record<string, unknown>;
    if (typeof output.text === "string" && output.text.trim()) {
      console.log("[AI] Extracted via response.output.text");
      return output.text;
    }
    if (Array.isArray(output.choices) && output.choices.length > 0) {
      const choice = output.choices[0] as Record<string, unknown>;
      if (typeof choice.message === "object") {
        const msg = choice.message as Record<string, unknown>;
        if (typeof msg.content === "string") {
          console.log("[AI] Extracted via response.output.choices[0].message.content");
          return msg.content;
        }
      }
    }
  }

  // Format 6: response.message.content
  if (r.message && typeof r.message === "object") {
    const msg = r.message as Record<string, unknown>;
    if (typeof msg.content === "string" && msg.content.trim()) {
      console.log("[AI] Extracted via response.message.content");
      return msg.content;
    }
  }

  // Nothing worked — log full response and throw
  console.error(
    "[AI] Could not extract content. Full response:",
    JSON.stringify(r, null, 2).slice(0, 1000)
  );
  throw new Error(
    `Could not extract content from API response. Keys: ${Object.keys(r).join(", ")}`
  );
}

export function extractJSON(raw: string): string {
  if (!raw || raw.trim() === "") {
    throw new Error("AI returned empty response");
  }

  let text = raw.trim();

  console.log("[AI extractJSON] Raw length:", text.length);
  console.log("[AI extractJSON] First 300 chars:", text.slice(0, 300));

  // Remove <think>...</think> blocks (GLM-5.1 thinking mode)
  const beforeThink = text.length;
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (text.length !== beforeThink) {
    console.log(
      "[AI extractJSON] Removed <think> block, remaining:",
      text.slice(0, 200)
    );
  }

  // Remove markdown code fences
  text = text.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();

  // Try direct parse
  try {
    JSON.parse(text);
    console.log("[AI extractJSON] Direct parse succeeded");
    return text;
  } catch {
    // Not clean JSON yet
  }

  // Extract JSON array
  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    const candidate = text.slice(arrayStart, arrayEnd + 1);
    try {
      JSON.parse(candidate);
      console.log("[AI extractJSON] Extracted JSON array");
      return candidate;
    } catch {
      console.log("[AI extractJSON] Array extraction failed");
    }
  }

  // Extract JSON object
  const objStart = text.indexOf("{");
  const objEnd = text.lastIndexOf("}");
  if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
    const candidate = text.slice(objStart, objEnd + 1);
    try {
      JSON.parse(candidate);
      console.log("[AI extractJSON] Extracted JSON object");
      return candidate;
    } catch {
      console.log("[AI extractJSON] Object extraction failed");
    }
  }

  console.error(
    "[AI extractJSON] All extraction methods failed. Full raw:",
    raw
  );
  throw new Error(
    `Cannot extract JSON from AI response: ${raw.slice(0, 100)}`
  );
}

export async function createAIClient(): Promise<OpenAI> {
  const config = await getAIConfig();
  if (!config.apiKey) {
    throw new Error(
      "No AI API key configured. Add AI_API_KEY to .env or configure in Settings."
    );
  }
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    dangerouslyAllowBrowser: false,
  });
}

export async function chat(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    max_tokens?: number;
    response_format?: { type: "json_object" | "text" };
  }
): Promise<string> {
  const config = await getAIConfig();
  const client = await createAIClient();

  console.log(
    `[AI chat] Model: ${config.model} | Provider: ${config.provider}`
  );
  console.log(
    `[AI chat] Prompt length: ${
      messages[0]?.content?.toString().length ?? 0
    } chars`
  );

  try {
    // Use raw fetch instead of OpenAI SDK to handle non-standard responses
    const requestBody = {
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.max_tokens ?? 1500,
    };

    console.log("[AI chat] Sending request to:", config.baseURL);

    const response = await fetch(
      `${config.baseURL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log("[AI chat] HTTP status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI chat] HTTP error:", response.status, errorText);
      throw new Error(
        `API HTTP error ${response.status}: ${errorText.slice(0, 200)}`
      );
    }

    const rawData = await response.json();
    console.log("[AI chat] Response received, extracting content...");

    const content = extractContentFromResponse(rawData);
    console.log(`[AI chat] Content length: ${content.length} chars`);

    return content;
  } catch (error) {
    console.error("[AI chat] Failed:", error);
    throw error;
  }
}

export const AI_PROVIDERS = [
  {
    id: "glm",
    name: "GLM (Zhipu AI)",
    baseUrl: "https://console.pivotbak.cfd/v1",
    models: ["glm-5.1", "glm-4-flash"],
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba)",
    baseUrl: "https://console.pivotbak.cfd/v1",
    models: ["qwen3.6-plus", "qwen-plus"],
  },
  {
    id: "minimax",
    name: "MiniMax",
    baseUrl: "https://console.pivotbak.cfd/v1",
    models: ["MiniMax-M2.7-highspeed"],
  },
] as const;