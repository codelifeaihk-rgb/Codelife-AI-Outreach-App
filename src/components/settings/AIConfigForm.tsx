"use client";

// src/components/settings/AIConfigForm.tsx
// Client component — handles AI provider switching and Tavily key update.

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AI_PROVIDERS } from "@/src/lib/ai-providers";

const PROVIDER_NOTES: Record<string, string> = {
  glm: "Get your key at open.bigmodel.cn — free credits included.",
  qwen: "Get your key at dashscope.console.aliyun.com.",
  minimax: "Get your key at platform.minimaxi.com.",
  openai: "Get your key at platform.openai.com — requires billing.",
  deepseek: "Get your key at platform.deepseek.com — very affordable.",
};

interface AIConfigFormProps {
  currentConfig: {
    provider: string;
    baseURL: string;
    model: string;
    apiKey: string;
  };
  currentSearchConfig: {
    apiKey: string;
    provider: string;
  };
  saveAIAction: (formData: FormData) => Promise<void>;
  saveSearchAction: (formData: FormData) => Promise<void>;
}

export default function AIConfigForm({
  currentConfig,
  currentSearchConfig,
  saveAIAction,
  saveSearchAction,
}: AIConfigFormProps) {
  const [selectedProviderId, setSelectedProviderId] = useState(
    currentConfig.provider
  );
  const [baseUrl, setBaseUrl] = useState(currentConfig.baseURL);
  const [selectedModel, setSelectedModel] = useState(currentConfig.model);

  const providerData = AI_PROVIDERS.find((p) => p.id === selectedProviderId);
  const models = providerData?.models ?? [];
  const note = PROVIDER_NOTES[selectedProviderId] ?? "";

  function handleProviderChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const provider = AI_PROVIDERS.find((p) => p.id === e.target.value);
    if (!provider) return;
    setSelectedProviderId(provider.id);
    setBaseUrl(provider.baseUrl);
    setSelectedModel(provider.models[0]);
  }

  return (
    <div className="space-y-8">

      {/* ── AI Provider Section ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-4">
          AI Provider
        </h3>
        <form action={saveAIAction} className="space-y-5">

          {/* Provider */}
          <div className="space-y-1.5">
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              name="provider"
              value={selectedProviderId}
              onChange={handleProviderChange}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {note && <p className="text-xs text-slate-400">{note}</p>}
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              name="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://open.bigmodel.cn/api/paas/v4"
            />
            <p className="text-xs text-slate-400">
              Auto-filled when you select a provider. Only change for custom endpoints.
            </p>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              defaultValue={currentConfig.apiKey}
              placeholder="Paste your API key here"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              name="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Current AI config */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Currently active:</p>
            <p>Provider: <span className="font-mono">{currentConfig.provider}</span></p>
            <p>Model: <span className="font-mono">{currentConfig.model}</span></p>
            <p>Base URL: <span className="font-mono break-all">{currentConfig.baseURL}</span></p>
          </div>

          <Button type="submit" className="w-full">
            Save AI Configuration
          </Button>
        </form>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-200" />

      {/* ── Search Provider Section ── */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">
          Search Provider
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Used for public contact discovery and institution search.
          Get your free key at{" "}
          
            <a href="https://tavily.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-slate-500"
          >
            tavily.com
          </a>
          {" "}— 1,000 free searches/month.
        </p>
        <form action={saveSearchAction} className="space-y-4">

          {/* Provider — Tavily only for now */}
          <div className="space-y-1.5">
            <Label htmlFor="searchProvider">Provider</Label>
            <select
              id="searchProvider"
              name="searchProvider"
              defaultValue="tavily"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="tavily">Tavily (Recommended)</option>
            </select>
          </div>

          {/* Tavily API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="tavilyApiKey">Tavily API Key</Label>
            <Input
              id="tavilyApiKey"
              name="tavilyApiKey"
              type="password"
              defaultValue={currentSearchConfig.apiKey}
              placeholder="tvly-..."
            />
          </div>

          {/* Current search config */}
          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 space-y-1">
            <p className="font-medium text-slate-700">Currently active:</p>
            <p>
              Provider:{" "}
              <span className="font-mono">{currentSearchConfig.provider}</span>
            </p>
            <p>
              Key set:{" "}
              <span className="font-mono">
                {currentSearchConfig.apiKey ? "✅ Yes" : "❌ Not set"}
              </span>
            </p>
          </div>

          <Button type="submit" className="w-full">
            Save Search Configuration
          </Button>
        </form>
      </div>

    </div>
  );
}