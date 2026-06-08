"use client";

// src/components/campaigns/NewCampaignForm.tsx
// Campaign creation form with:
// - Natural language description → AI auto-fills form
// - File upload for campaign brief
// - Manual form fields with smart dropdowns

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Upload, ChevronDown, ChevronUp } from "lucide-react";

const COUNTRIES = [
  "Malaysia", "Singapore", "Indonesia", "Thailand", "Philippines",
  "Vietnam", "United Kingdom", "Germany", "France", "Netherlands",
  "United States", "Canada", "Australia", "Japan", "South Korea",
  "China", "India", "Saudi Arabia", "UAE", "Egypt",
  "Nigeria", "South Africa", "Brazil", "Mexico", "Other",
];

const LANGUAGES = [
  "English", "Malay", "Mandarin", "Arabic", "French",
  "German", "Spanish", "Japanese", "Korean", "Other",
];

const DEPARTMENTS = [
  "Biomedical Engineering", "Life Sciences", "Biotechnology",
  "Bioinformatics", "Medicine", "Pharmacy", "Molecular Biology",
  "Computer Science / AI", "Innovation Centre", "Other",
];

interface FormData {
  name: string;
  audienceMode: "university" | "school";
  targetCountry: string;
  targetInstitution: string;
  targetDepartment: string;
  targetLanguage: string;
  description: string;
}

export default function NewCampaignForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    name: "",
    audienceMode: "university",
    targetCountry: "",
    targetInstitution: "",
    targetDepartment: "",
    targetLanguage: "English",
    description: "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  function update(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // AI auto-fill from natural language description
  async function handleAIFill() {
    if (!form.description.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/campaigns/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: form.description }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, ...data.fields }));
      }
    } catch {
      console.error("AI autofill failed");
    } finally {
      setAiLoading(false);
    }
  }

  // File upload handler
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileUploading(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      // Set as description for AI to analyse
      setForm((prev) => ({
        ...prev,
        description: `Extracted from file "${file.name}":\n\n${text.slice(0, 2000)}`,
      }));
    } catch {
      console.error("File read failed");
    } finally {
      setFileUploading(false);
    }
  }

  // Create campaign
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.audienceMode || !form.targetCountry) return;
    setSaving(true);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/campaigns/${data.campaign.id}`);
        router.refresh();
      }
    } catch {
      console.error("Campaign creation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Natural language section */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            Describe your campaign goal (optional)
          </CardTitle>
          <CardDescription className="text-xs">
            Tell the AI what you want to achieve and it will fill the form for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder={
              `Example: "I want to reach biomedical engineering professors ` +
              `in Malaysian universities for Q3 2026 outreach. Focus on ` +
              `universities with strong biotech research."`
            }
            rows={3}
            className="w-full border border-blue-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAIFill}
              disabled={aiLoading || !form.description.trim()}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  Filling form...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Auto-fill form with AI
                </>
              )}
            </Button>

            {/* File upload */}
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-3 py-1.5 bg-white hover:bg-slate-50">
                {fileUploading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                {fileName || "Upload brief"}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Main form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
          <CardDescription>
            Required fields are marked. Rest can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Campaign name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Campaign Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Q3 Malaysia University Outreach"
              required
            />
          </div>

          {/* Audience mode */}
          <div className="space-y-1.5">
            <Label>
              Audience Mode <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                  form.audienceMode === "university"
                    ? "border-blue-400 bg-blue-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="audienceMode"
                  value="university"
                  checked={form.audienceMode === "university"}
                  onChange={() => update("audienceMode", "university")}
                  className="accent-blue-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    University Mode
                  </p>
                  <p className="text-xs text-slate-400">
                    Professors, lab heads, departments
                  </p>
                </div>
              </label>
              <label
                className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                  form.audienceMode === "school"
                    ? "border-green-400 bg-green-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="audienceMode"
                  value="school"
                  checked={form.audienceMode === "school"}
                  onChange={() => update("audienceMode", "school")}
                  className="accent-green-600"
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    School Mode
                  </p>
                  <p className="text-xs text-slate-400">
                    School leaders, science coordinators
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Target country */}
          <div className="space-y-1.5">
            <Label htmlFor="country">
              Target Country <span className="text-red-400">*</span>
            </Label>
            <select
              id="country"
              value={form.targetCountry}
              onChange={(e) => update("targetCountry", e.target.value)}
              required
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Advanced fields toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showAdvanced ? "Hide" : "Show"} optional fields
          </button>

          {showAdvanced && (
            <div className="space-y-4 pt-2 border-t border-slate-100">

              {/* Target institution */}
              <div className="space-y-1.5">
                <Label htmlFor="institution">
                  Target Institution{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <Input
                  id="institution"
                  value={form.targetInstitution}
                  onChange={(e) => update("targetInstitution", e.target.value)}
                  placeholder="e.g. University of Malaya"
                />
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <Label htmlFor="dept">
                  Target Department{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <select
                  id="dept"
                  value={form.targetDepartment}
                  onChange={(e) => update("targetDepartment", e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <Label htmlFor="lang">
                  Target Language{" "}
                  <span className="text-slate-400 font-normal">(optional)</span>
                </Label>
                <select
                  id="lang"
                  value={form.targetLanguage}
                  onChange={(e) => update("targetLanguage", e.target.value)}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            disabled={saving || !form.name || !form.targetCountry}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}