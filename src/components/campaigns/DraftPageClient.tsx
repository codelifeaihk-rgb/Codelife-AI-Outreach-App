"use client";

// src/components/campaigns/DraftPageClient.tsx
// Client wrapper for the drafts page.
// Manages draft state and handles approve/reject/regenerate actions.

import { useState } from "react";
import DraftGenerator from "@/src/components/campaigns/DraftGenerator";
import DraftCard from "@/src/components/campaigns/DraftCard";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2 } from "lucide-react";

interface QualityScore {
  overall: number;
  subjectClarity: number;
  spamRisk: number;
  length: number;
  tone: number;
  ctaClarity: number;
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

interface DraftPageClientProps {
  campaignId: string;
  audienceMode: string;
  contacts: Contact[];
  initialDrafts: Draft[];
}

export default function DraftPageClient({
  campaignId,
  audienceMode,
  contacts,
  initialDrafts,
}: DraftPageClientProps) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [activeTab, setActiveTab] = useState<"generate" | "review">(
    initialDrafts.length > 0 ? "review" : "generate"
  );

  const approvedCount = drafts.filter((d) => d.status === "approved").length;
  const pendingCount = drafts.filter((d) => d.status === "draft").length;

  async function refreshDrafts() {
    const res = await fetch(`/api/campaigns/${campaignId}/drafts`);
    if (res.ok) {
      const data = await res.json();
      setDrafts(data.drafts ?? []);
      if (data.drafts?.length > 0) setActiveTab("review");
    }
  }

  async function handleApprove(draftId: string) {
    const res = await fetch(
      `/api/campaigns/${campaignId}/drafts/${draftId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      }
    );
    if (res.ok) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId ? { ...d, status: "approved" } : d
        )
      );
    }
  }

  async function handleReject(draftId: string) {
    const res = await fetch(
      `/api/campaigns/${campaignId}/drafts/${draftId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      }
    );
    if (res.ok) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.id === draftId ? { ...d, status: "rejected" } : d
        )
      );
    }
  }

  // Add this function inside DraftPageClient
async function handleUpdate(
  draftId: string,
  updates: { subject: string; bodyHtml: string }
) {
  const res = await fetch(
    `/api/campaigns/${campaignId}/drafts/${draftId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", ...updates }),
    }
  );
  if (res.ok) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.id === draftId
          ? { ...d, subject: updates.subject, bodyHtml: updates.bodyHtml }
          : d
      )
    );
  }
}

  async function handleRegenerate(draftId: string) {
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return;

    // Find the contact id from drafts list
    const res = await fetch(`/api/campaigns/${campaignId}/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: draftId,
        audienceMode,
        language: draft.targetLanguage ?? "en",
      }),
    });

    if (res.ok) {
      await refreshDrafts();
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "generate"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Generate Drafts
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === "review"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Review Drafts
          {drafts.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              {drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      {drafts.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="text-slate-500">
            <FileText className="w-3 h-3 mr-1" />
            {drafts.length} total
          </Badge>
          {approvedCount > 0 && (
            <Badge
              variant="outline"
              className="text-green-600 border-green-200"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {approvedCount} approved
            </Badge>
          )}
          {pendingCount > 0 && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-200"
            >
              {pendingCount} pending review
            </Badge>
          )}
        </div>
      )}

      {/* Generate tab */}
      {activeTab === "generate" && (
        <DraftGenerator
          campaignId={campaignId}
          audienceMode={audienceMode}
          contacts={contacts}
          onDraftsGenerated={refreshDrafts}
        />
      )}

      {/* Review tab */}
      {activeTab === "review" && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">
                No drafts yet. Go to Generate Drafts tab to create some.
              </p>
            </div>
          ) : (
            drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                campaignId={campaignId}  
                draft={draft}
                onApprove={handleApprove}
                onReject={handleReject}
                onRegenerate={handleRegenerate}
                onUpdate={handleUpdate}
              />
            ))
          )}

          {approvedCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                {approvedCount} draft{approvedCount > 1 ? "s" : ""} approved
                and ready to send
              </p>
              <p className="text-green-600 text-sm mt-1">
                Gmail OAuth sending will be available in the next phase.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}