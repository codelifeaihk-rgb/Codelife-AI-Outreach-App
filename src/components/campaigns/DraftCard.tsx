"use client";

// src/components/campaigns/DraftCard.tsx
// Draft card with integrated non-technical editor.
// Shows quality scores, approve/reject/regenerate, and inline editing.

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SendEmailButton from "@/src/components/campaigns/SendEmailButton";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Edit2,
  Eye,
  Loader2,
  Code,
  Save,
  X,
  Palette,
} from "lucide-react";

interface QualityScore {
  overall: number;
  subjectClarity: number;
  spamRisk: number;
  length: number;
  tone: number;
  ctaClarity: number;
  backgroundColor?: string;
  extractedFields?: Record<string, string>;
}

interface Draft {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  status: string;
  personalizationReason?: string;
  qualityScore?: QualityScore;
  targetLanguage?: string;
  version: number;
  contact: {
    fullName: string;
    email: string | null;
    role: string | null;
    institutionName: string | null;
  };
}

interface DraftCardProps {
  campaignId: string;           // ← add this
  draft: Draft;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
  onUpdate: (id: string, updates: { subject: string; bodyHtml: string }) => Promise<void>;
}

const BG_COLORS = [
  { label: "Light Grey", value: "#f6f8fa" },
  { label: "White", value: "#ffffff" },
  { label: "Dark Navy", value: "#0f172a" },
  { label: "Soft Blue", value: "#eff6ff" },
  { label: "Warm White", value: "#fafafa" },
];

function ScoreBadge({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const isGood = invert ? value <= 3 : value >= 7;
  const isMid = invert ? value <= 5 : value >= 5;
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-bold ${isGood ? "text-green-600" : isMid ? "text-amber-500" : "text-red-500"}`}>
        {value}
      </span>
      <span className="text-xs text-slate-400 text-center leading-tight">{label}</span>
    </div>
  );
}

export default function DraftCard({ draft, onApprove, onReject, onRegenerate, onUpdate }: DraftCardProps) {
  const [showBody, setShowBody] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "html">("preview");
  const [loading, setLoading] = useState<"approve" | "reject" | "regenerate" | "save" | null>(null);

  // Editable fields
  const [subject, setSubject] = useState(draft.subject);
  const [bodyHtml, setBodyHtml] = useState(draft.bodyHtml);
  const [bgColor, setBgColor] = useState(
    draft.qualityScore?.backgroundColor ?? "#f6f8fa"
  );
  const [customColor, setCustomColor] = useState(
    draft.qualityScore?.backgroundColor ?? "#f6f8fa"
  );

  // Extract editable fields from HTML
  const [fields, setFields] = useState({
    senderName: extractField(draft.bodyHtml, "senderName") ?? "",
    senderTitle: extractField(draft.bodyHtml, "senderTitle") ?? "",
    companyName: "Solar Trinity Science Limited",
    ctaText: extractCTA(draft.bodyHtml) ?? "Book a Free Demo",
    notes: "",
  });

  const isApproved = draft.status === "approved";
  const isRejected = draft.status === "rejected";
  const score = draft.qualityScore;

  // Apply field changes to HTML
  function applyFieldChange(key: string, value: string, html: string, bg: string) {
    let result = html;

    if (key === "bgColor") {
      // Replace outer background colors only
      result = result.replace(
        /(background-color:\s*)(#f6f8fa|#ffffff|#eff6ff|#fafafa|#0f172a)(?=[^}]*(?:wrapper|outer|body))?/gi,
        (match, prefix, color) => {
          // Don't replace card/feature colors
          if (["#1e293b", "#0f172a", "#38bdf8"].includes(color.toLowerCase())) return match;
          return `${prefix}${bg}`;
        }
      );
      // Also update body background
      result = result.replace(
        /(<body[^>]*style="[^"]*background-color:)\s*[^;"]*/i,
        `$1 ${bg}`
      );
      return result;
    }

    return result;
  }

  function handleBgColor(color: string) {
    setBgColor(color);
    setCustomColor(color);
    const updated = applyFieldChange("bgColor", color, bodyHtml, color);
    setBodyHtml(updated);
  }

  async function handleSave() {
    setLoading("save");
    await onUpdate(draft.id, { subject, bodyHtml });
    setLoading(null);
    setEditMode(false);
  }

  async function handleApprove() {
    setLoading("approve");
    await onApprove(draft.id);
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    await onReject(draft.id);
    setLoading(null);
  }

  async function handleRegenerate() {
    setLoading("regenerate");
    await onRegenerate(draft.id);
    setLoading(null);
  }

  return (
    <Card className={`transition-all ${isApproved ? "border-green-300 bg-green-50/30" : isRejected ? "border-slate-200 opacity-60" : "border-slate-200"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-semibold text-slate-900">{draft.contact.fullName}</span>
              {draft.contact.email && (
                <span className="text-xs text-blue-500 font-mono">{draft.contact.email}</span>
              )}
              {draft.contact.role && (
                <span className="text-xs text-slate-400">{draft.contact.role}</span>
              )}
              {draft.targetLanguage && draft.targetLanguage !== "en" && (
                <Badge variant="outline" className="text-xs">{draft.targetLanguage.toUpperCase()}</Badge>
              )}
              <Badge variant="outline" className="text-xs">v{draft.version}</Badge>
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">
              Subject: {subject}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isApproved ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />Approved
              </Badge>
            ) : isRejected ? (
              <Badge className="bg-slate-100 text-slate-500 border-slate-200">
                <XCircle className="w-3 h-3 mr-1" />Rejected
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                Pending Review
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quality scores */}
        {score && (
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 mb-3">Email Quality Score</p>
            <div className="grid grid-cols-6 gap-2 text-center">
              <ScoreBadge label="Overall" value={score.overall} />
              <ScoreBadge label="Subject" value={score.subjectClarity} />
              <ScoreBadge label="Spam Risk" value={score.spamRisk} invert />
              <ScoreBadge label="Length" value={score.length} />
              <ScoreBadge label="Tone" value={score.tone} />
              <ScoreBadge label="CTA" value={score.ctaClarity} />
            </div>
          </div>
        )}

        {/* Personalization reason */}
        {draft.personalizationReason && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-medium text-blue-600 mb-1">Why this draft was written this way</p>
            <p className="text-xs text-blue-700">{draft.personalizationReason}</p>
          </div>
        )}

        {/* Edit / Preview toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowBody(!showBody); setEditMode(false); }}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            {showBody ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showBody ? "Hide" : "View"} email
          </button>
          {showBody && !isApproved && !isRejected && (
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ml-auto ${
                editMode ? "bg-blue-100 text-blue-700" : "text-slate-400 hover:text-slate-600 border border-slate-200"
              }`}
            >
              <Edit2 className="w-3 h-3" />
              {editMode ? "Editing..." : "Edit Draft"}
            </button>
          )}
        </div>

        {/* Email body section */}
        {showBody && (
          <div className="space-y-4">
            {/* EDIT MODE */}
            {editMode ? (
              <div className="space-y-5 border border-blue-200 rounded-xl p-4 bg-blue-50/30">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Edit Draft
                </p>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Subject Line</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Background color */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />
                    Email Background Color
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BG_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => handleBgColor(c.value)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                          bgColor === c.value
                            ? "border-blue-400 bg-blue-50 text-blue-700 font-medium"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-slate-200 shrink-0"
                          style={{ backgroundColor: c.value }}
                        />
                        {c.label}
                      </button>
                    ))}
                    {/* Custom color */}
                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-slate-200 cursor-pointer hover:border-slate-300">
                      <input
                        type="color"
                        value={customColor}
                        onChange={(e) => handleBgColor(e.target.value)}
                        className="w-4 h-4 rounded cursor-pointer border-0 p-0"
                      />
                      Custom
                    </label>
                  </div>
                </div>

                {/* Sender fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sender Name</Label>
                    <Input
                      value={fields.senderName}
                      onChange={(e) => setFields({ ...fields, senderName: e.target.value })}
                      placeholder="e.g. Ahmad Rizal"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Sender Title / Position</Label>
                    <Input
                      value={fields.senderTitle}
                      onChange={(e) => setFields({ ...fields, senderTitle: e.target.value })}
                      placeholder="e.g. Business Development Manager"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Name</Label>
                    <Input
                      value={fields.companyName}
                      onChange={(e) => setFields({ ...fields, companyName: e.target.value })}
                      placeholder="e.g. Solar Trinity Science Limited"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CTA Button Text</Label>
                    <Input
                      value={fields.ctaText}
                      onChange={(e) => setFields({ ...fields, ctaText: e.target.value })}
                      placeholder="e.g. Book a Free Demo"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Additional Notes about this Professor / Contact
                    <span className="text-slate-400 font-normal ml-1">(optional)</span>
                  </Label>
                  <textarea
                    value={fields.notes}
                    onChange={(e) => setFields({ ...fields, notes: e.target.value })}
                    rows={2}
                    placeholder="e.g. Mention their recent paper on CRISPR published in Nature..."
                    className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                </div>

                {/* Advanced HTML toggle */}
                <details className="group">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 list-none">
                    <Code className="w-3 h-3" />
                    Advanced — Edit full HTML
                  </summary>
                  <div className="mt-3">
                    <textarea
                      value={bodyHtml}
                      onChange={(e) => setBodyHtml(e.target.value)}
                      rows={12}
                      className="w-full font-mono text-xs border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                    />
                  </div>
                </details>

                {/* Save / Cancel */}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={loading === "save"}
                    className="flex-1"
                  >
                    {loading === "save" ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Save className="w-3 h-3 mr-1" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setBodyHtml(draft.bodyHtml);
                      setSubject(draft.subject);
                    }}
                    className="flex-1"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                      viewMode === "preview" ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Eye className="w-3 h-3" />Preview
                  </button>
                  <button
                    onClick={() => setViewMode("html")}
                    className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 ${
                      viewMode === "html" ? "bg-slate-200 text-slate-700" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    <Code className="w-3 h-3" />HTML
                  </button>
                </div>

                {viewMode === "preview" ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 flex items-center gap-2 border-b border-slate-200">
                      <div className="flex gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <span className="text-xs text-slate-400">Email Preview</span>
                    </div>
                    <iframe
                      srcDoc={bodyHtml}
                      style={{ width: "100%", minHeight: "400px", border: "none" }}
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-auto max-h-64 border border-slate-200 whitespace-pre-wrap">
                    {bodyHtml.slice(0, 1000)}
                    {bodyHtml.length > 1000 && "\n... [truncated]"}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isApproved && !isRejected && (
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={loading !== null}
            >
              {loading === "approve" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleRegenerate}
              disabled={loading !== null}
            >
              {loading === "regenerate" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Regenerate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={handleReject}
              disabled={loading !== null}
            >
              {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              Reject
            </Button>
          </div>
        )}

{isApproved && (
  <div className="space-y-3 border-t border-slate-100 pt-3">
    <div className="flex items-center gap-2 text-green-700">
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <p className="text-sm font-medium">
        Approved — ready to send
      </p>
    </div>
    {draft.contact.email ? (
      <SendEmailButton
        campaignId={draft.id.split("_")[0]}
        draftId={draft.id}
        recipientEmail={draft.contact.email}
        onSent={() => {
          // Optionally trigger refresh
        }}
      />
    ) : (
      <p className="text-xs text-amber-500">
        No email address for this contact — cannot send.
      </p>
    )}
  </div>
)}
      </CardContent>
    </Card>
  );
}

// Helper to extract sender name from HTML
function extractField(html: string, field: string): string | null {
  if (field === "senderName") {
    const match = html.match(/<strong[^>]*>([^<]+)<\/strong>/);
    return match ? match[1] : null;
  }
  return null;
}

// Helper to extract CTA button text
function extractCTA(html: string): string | null {
  const match = html.match(/href="[^"]*demo[^"]*"[^>]*>([^<]+)<\/a>/i);
  return match ? match[1].trim() : null;
}