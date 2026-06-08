// Client-safe AI provider metadata (no Prisma / OpenAI imports).

export const AI_PROVIDERS = [
  {
    id: "glm",
    name: "GLM (Zhipu AI)",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: ["glm-5.1", "glm-4-flash", "glm-4"],
  },
  {
    id: "qwen",
    name: "Qwen (Alibaba)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    models: ["qwen3.6-plus", "qwen-plus", "qwen-turbo"],
  },
  {
    id: "minimax",
    name: "MiniMax",
    baseUrl: "https://api.minimax.chat/v1",
    models: ["MiniMax-M2.7-highspeed", "abab6.5s-chat"],
  },
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat"],
  },
] as const;
