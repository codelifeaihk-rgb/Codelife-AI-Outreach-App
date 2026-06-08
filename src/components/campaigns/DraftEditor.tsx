"use client";

// src/components/campaigns/DraftEditor.tsx
// Improved draft editor with:
// - Simple form fields for non-technical users
// - Live email preview that updates as you type
// - Advanced HTML mode for power users
// - Background color picker
// - Saves edits back to parent component

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Code,
  Settings2,
  ChevronDown,
  ChevronUp,
  Save,
} from "lucide-react";

interface ExtractedFields {
  contactName?: string;
  institution?: string;
  department?: string;
  role?: string;
  personalizationHook?: string;
  ctaText?: string;
  senderName?: string;
  senderTitle?: string;
}

interface DraftEditorProps {
  subject: string;
  bodyHtml: string;
  extractedFields?: ExtractedFields;
  backgroundColor?: string;
  onSave: (updates: {
    subject: string;
    bodyHtml: string;
    backgroundColor: string;
  }) => void;
  onCancel: () => void;
}

const BACKGROUND_COLORS = [
  { label: "Light Grey", value: "#f6f8fa" },
  { label: "White", value: "#ffffff" },
  { label: "Dark Navy", value: "#0f172a" },
  { label: "Soft Blue", value: "#eff6ff" },
  { label: "Warm Grey", value: "#f9fafb" },
  { label: "Custom", value: "custom" },
];

export default function DraftEditor({
  subject,
  bodyHtml,
  extractedFields = {},
  backgroundColor = "#f6f8fa",
  onSave,
  onCancel,
}: DraftEditorProps) {
  const [mode, setMode] = useState<"simple" | "preview" | "advanced">(
    "simple"
  );
  const [editedSubject, setEditedSubject] = useState(subject);
  const [editedHtml, setEditedHtml] = useState(bodyHtml);
  const [bgColor, setBgColor] = useState(backgroundColor);
  const [customColor, setCustomColor] = useState(backgroundColor);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editable form fields
  const [fields, setFields] = useState({
    senderName: extractedFields.senderName ?? "",
    senderTitle: extractedFields.senderTitle ?? "",
    ctaText: extractedFields.ctaText ?? "Book a Free Demo",
    personalizationHook: extractedFields.personalizationHook ?? "",
    contactName: extractedFields.contactName ?? "",
    institution: extractedFields.institution ?? "",
    department: extractedFields.department ?? "",
  });

  // Apply field changes to HTML in real time
  const applyFieldsToHtml = useCallback(
    (updatedFields: typeof fields, html: string, bg: string) => {
      let result = html;
      // Replace background color
      result = result.replace(
        /background-color:\s*#[a-fA-F0-9]{3,6}/g,
        (match) => {
          // Only replace outer background colors, not card colors
          if (match.includes("#1e293b") || match.includes("#0f172a"))
            return match;
          return `background-color: ${bg}`;
        }
      );
      // Replace sender name
      if (updatedFields.senderName) {
        result = result.replace(
          /\[Your Name\]|{{SENDER_NAME}}/g,
          updatedFields.senderName
        );
      }
      // Replace sender title
      if (updatedFields.senderTitle) {
        result = result.replace(
          /\[Your Title\]|{{SENDER_TITLE}}/g,
          updatedFields.senderTitle
        );
      }
      // Replace CTA text
      if (updatedFields.ctaText) {
        result = result.replace(
          /Book a Free Demo|{{CTA_TEXT}}/g,
          updatedFields.ctaText
        );
      }
      return result;
    },
    []
  );

  function updateField(key: keyof typeof fields, value: string) {
    const updated = { ...fields, [key]: value };
    setFields(updated);
    setEditedHtml(applyFieldsToHtml(updated, editedHtml, bgColor));
  }

  function handleColorChange(value: string) {
    if (value === "custom") return;
    setBgColor(value);
    setEditedHtml(applyFieldsToHtml(fields, editedHtml, value));
  }

  function handleCustomColor(value: string) {
    setCustomColor(value);
    setBgColor(value);
    setEditedHtml(applyFieldsToHtml(fields, editedHtml, value));
  }

  function handleSave() {
    onSave({
      subject: editedSubject,
      bodyHtml: editedHtml,
      backgroundColor: bgColor,
    });
  }

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setMode("simple")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            mode === "simple"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Edit Fields
        </button>
        <button
          onClick={() => setMode("preview")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            mode === "preview"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>
        <button
          onClick={() => setMode("advanced")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
            mode === "advanced"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          HTML
        </button>
      </div>

      {/* Subject line — always visible */}
      <div className="space-y-1.5">
        <Label htmlFor="subject" className="text-sm font-medium">
          Subject Line
        </Label>
        <Input
          id="subject"
          value={editedSubject}
          onChange={(e) => setEditedSubject(e.target.value)}
          className="font-medium"
        />
      </div>

      {/* Background color picker — always visible */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Email Background Color
        </Label>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => handleColorChange(c.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
                bgColor === c.value && c.value !== "custom"
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {c.value !== "custom" && (
                <span
                  className="w-3 h-3 rounded-full border border-slate-300"
                  style={{ backgroundColor: c.value }}
                />
              )}
              {c.label}
            </button>
          ))}
          {/* Custom color picker */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-full">
            <input
              type="color"
              value={customColor}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="w-5 h-5 rounded cursor-pointer border-0"
              title="Custom color"
            />
            <span className="text-xs text-slate-500">
              {customColor}
            </span>
          </div>
        </div>
      </div>

      {/* Simple form fields mode */}
      {mode === "simple" && (
        <div className="space-y-4 bg-slate-50 rounded-lg p-4">
          <p className="text-xs text-slate-500 font-medium">
            Edit these fields — the preview updates automatically
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Your Name</Label>
              <Input
                value={fields.senderName}
                onChange={(e) => updateField("senderName", e.target.value)}
                placeholder="e.g. Ahmad Rizal"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Your Title</Label>
              <Input
                value={fields.senderTitle}
                onChange={(e) => updateField("senderTitle", e.target.value)}
                placeholder="e.g. Business Development Manager"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CTA Button Text</Label>
              <Input
                value={fields.ctaText}
                onChange={(e) => updateField("ctaText", e.target.value)}
                placeholder="e.g. Book a Free Demo"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Name</Label>
              <Input
                value={fields.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                placeholder="Auto-filled from contact"
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Personalization Hook{" "}
              <Badge variant="outline" className="text-xs ml-1">
                AI-generated
              </Badge>
            </Label>
            <textarea
              value={fields.personalizationHook}
              onChange={(e) =>
                updateField("personalizationHook", e.target.value)
              }
              rows={3}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              placeholder="The specific reason this contact is a great fit..."
            />
          </div>

          {/* Toggle advanced HTML */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            {showAdvanced ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
            {showAdvanced ? "Hide" : "Show"} raw HTML
          </button>

          {showAdvanced && (
            <textarea
              value={editedHtml}
              onChange={(e) => setEditedHtml(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          )}
        </div>
      )}

      {/* Live preview mode */}
      {mode === "preview" && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-100 px-3 py-2 flex items-center gap-2 border-b border-slate-200">
            <div className="flex gap-1">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-slate-400 ml-2">
              Email Preview — {editedSubject}
            </span>
          </div>
          <div
            className="overflow-auto max-h-[500px] bg-white"
            style={{ backgroundColor: bgColor }}
          >
            <iframe
              srcDoc={editedHtml}
              style={{
                width: "100%",
                minHeight: "500px",
                border: "none",
              }}
              title="Email Preview"
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      )}

      {/* Advanced HTML mode */}
      {mode === "advanced" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Edit raw HTML directly. Changes reflect in preview.
            </p>
            <Badge variant="outline" className="text-xs">
              {editedHtml.length.toLocaleString()} chars
            </Badge>
          </div>
          <textarea
            value={editedHtml}
            onChange={(e) => setEditedHtml(e.target.value)}
            rows={20}
            className="w-full font-mono text-xs border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
          />
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-2 border-t border-slate-100">
        <Button onClick={handleSave} className="flex-1">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}