"use client";

// src/components/campaigns/EmailEditor.tsx
// Simple visual HTML email editor for editing draft body content.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Code } from "lucide-react";

interface EmailEditorProps {
  html: string;
  onChange: (html: string) => void;
}

export default function EmailEditor({ html, onChange }: EmailEditorProps) {
  const [mode, setMode] = useState<"preview" | "code">("preview");

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "preview" ? "default" : "outline"}
          onClick={() => setMode("preview")}
        >
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "code" ? "default" : "outline"}
          onClick={() => setMode("code")}
        >
          <Code className="w-3 h-3 mr-1" />
          Edit HTML
        </Button>
      </div>

      {/* Editor / Preview */}
      {mode === "code" ? (
        <textarea
          value={html}
          onChange={(e) => onChange(e.target.value)}
          rows={16}
          className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      ) : (
        <div
          className="border border-slate-200 rounded-lg p-4 bg-white min-h-64 overflow-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}