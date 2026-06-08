"use client";

// src/components/campaigns/DraftGenerator.tsx
// Client component — draft generation form.
// Allows user to select contacts, upload template, choose language,
// and trigger AI draft generation.

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Sparkles,
  Upload,
  CheckCircle2,
  FileText,
  AlertCircle,
} from "lucide-react";

const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ms", label: "Malay" },
  { code: "zh", label: "Mandarin" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
];

interface Contact {
  id: string;
  fullName: string;
  email: string | null;
  role: string | null;
  department: string | null;
  institutionName: string | null;
  fitScore: number | null;
  isDecisionMaker: boolean;
}

interface DraftGeneratorProps {
  campaignId: string;
  audienceMode: string;
  contacts: Contact[];
  onDraftsGenerated: () => void;
}

export default function DraftGenerator({
  campaignId,
  audienceMode,
  contacts,
  onDraftsGenerated,
}: DraftGeneratorProps) {
  const [bannerImageUrl, setBannerImageUrl] = useState("");
const [closingImageUrl, setClosingImageUrl] = useState("");
const bannerInputRef = useRef<HTMLInputElement>(null);
const closingInputRef = useRef<HTMLInputElement>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [templateHtml, setTemplateHtml] = useState("");
  const [templateFileName, setTemplateFileName] = useState("");
  const [language, setLanguage] = useState("en");
  const [generating, setGenerating] = useState(false);
  const [generatingFor, setGeneratingFor] = useState("");
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUniversity = audienceMode === "university";

  function toggleContact(id: string) {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedContacts(contacts.map((c) => c.id));
  }

  function selectDecisionMakers() {
    setSelectedContacts(
      contacts.filter((c) => c.isDecisionMaker).map((c) => c.id)
    );
  }

  async function handleTemplateUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFileName(file.name);
    const text = await file.text();
    setTemplateHtml(text);
  }

  async function handleImageUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  type: "banner" | "closing"
) {
  const file = e.target.files?.[0];
  if (!file) return;

  // For MVP — use object URL for preview, send to API for storage
  const objectUrl = URL.createObjectURL(file);
  if (type === "banner") setBannerImageUrl(objectUrl);
  else setClosingImageUrl(objectUrl);
}

  async function handleGenerate() {
    if (selectedContacts.length === 0) {
      setError("Please select at least one contact.");
      return;
    }

    setGenerating(true);
    setError("");
    setSuccessCount(0);

    // Generate drafts one at a time to show progress
    let count = 0;
    for (const contactId of selectedContacts) {
      const contact = contacts.find((c) => c.id === contactId);
      setGeneratingFor(contact?.fullName ?? "contact");

      try {
        const res = await fetch(`/api/campaigns/${campaignId}/drafts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId,
            templateHtml: templateHtml || null,
            language,
            audienceMode,
          }),
        });

        if (res.ok) {
          count++;
          setSuccessCount(count);
        }
      } catch {
        console.error(`Failed to generate draft for ${contactId}`);
      }
    }

    setGenerating(false);
    setGeneratingFor("");

    if (count > 0) {
      onDraftsGenerated();
    }
  }

  return (
    <div className="space-y-5">
      {/* Template upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            Base Email Template
          </CardTitle>
          <CardDescription>
            Upload an HTML template or leave blank to use the default
            CodeLife.ai template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm"
            onChange={handleTemplateUpload}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload HTML Template
            </Button>
            {templateFileName && (
              <div className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                {templateFileName}
              </div>
            )}
          </div>

          {!templateFileName && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-xs text-blue-600">
                No template uploaded — the AI will use the default
                CodeLife.ai email template with your contact details.
              </p>
            </div>
          )}

          {templateHtml && (
            <details className="text-xs">
              <summary className="cursor-pointer text-slate-400 hover:text-slate-600">
                Preview template HTML
              </summary>
              <pre className="mt-2 p-2 bg-slate-50 rounded text-xs overflow-auto max-h-32">
                {templateHtml.slice(0, 500)}...
              </pre>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Language selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Output Language</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  language === lang.code
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

{/* Image customization */}
<div className="border-t border-slate-100 pt-4 space-y-3">
  <p className="text-xs font-medium text-slate-500">
    Banner & Closing Images (optional)
  </p>
  <div className="grid grid-cols-2 gap-3">
    <div>
      <p className="text-xs text-slate-400 mb-1.5">Header Banner</p>
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, "banner")}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => bannerInputRef.current?.click()}
        className="w-full border border-dashed border-slate-200 rounded-lg p-3 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-center"
      >
        {bannerImageUrl ? (
          <img
            src={bannerImageUrl}
            alt="Banner preview"
            className="w-full h-12 object-cover rounded"
          />
        ) : (
          "Upload banner image"
        )}
      </button>
    </div>
    <div>
      <p className="text-xs text-slate-400 mb-1.5">Closing Image</p>
      <input
        ref={closingInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e, "closing")}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => closingInputRef.current?.click()}
        className="w-full border border-dashed border-slate-200 rounded-lg p-3 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-center"
      >
        {closingImageUrl ? (
          <img
            src={closingImageUrl}
            alt="Closing preview"
            className="w-full h-12 object-cover rounded"
          />
        ) : (
          "Upload closing image"
        )}
      </button>
    </div>
  </div>
  <p className="text-xs text-slate-400">
    Leave empty to use the default CodeLifeAI template images.
  </p>
</div>

      {/* Contact selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Select Contacts ({selectedContacts.length} selected)
          </CardTitle>
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={selectAll}
            >
              Select All ({contacts.length})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={selectDecisionMakers}
            >
              Decision Makers Only
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedContacts([])}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {contacts.map((contact) => (
              <label
                key={contact.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedContacts.includes(contact.id)
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => toggleContact(contact.id)}
                  className="accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900">
                      {contact.fullName}
                    </p>
                    {contact.isDecisionMaker && (
                      <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                        Decision Maker
                      </Badge>
                    )}
                    {contact.fitScore && (
                      <span className="text-xs text-slate-400">
                        Fit: {Number(contact.fitScore).toFixed(0)}/100
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {contact.role}
                    {contact.institutionName
                      ? ` · ${contact.institutionName}`
                      : ""}
                  </p>
                  {contact.email && (
                    <p className="text-xs text-blue-500 font-mono">
                      {contact.email}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Generate button */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {generating && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Generating draft for {generatingFor}...
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                {successCount} of {selectedContacts.length} completed
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleGenerate}
        disabled={generating || selectedContacts.length === 0}
        className="w-full"
        size="lg"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating {successCount}/{selectedContacts.length}...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate {selectedContacts.length > 0
              ? `${selectedContacts.length} Draft${selectedContacts.length > 1 ? "s" : ""}`
              : "Drafts"}
          </>
        )}
      </Button>
    </div>
  );
}