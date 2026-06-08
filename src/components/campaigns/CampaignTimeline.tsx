"use client";

// src/components/campaigns/CampaignTimeline.tsx
// Persistent campaign timeline — always visible throughout the campaign workflow.
// Shows progress from campaign creation to emails sent.
// Sticky at the top of all campaign sub-pages.

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Search,
  Users,
  FileText,
  Send,
  Megaphone,
} from "lucide-react";

interface CampaignTimelineProps {
  campaignId: string;
  campaignName: string;
  universitiesCount: number;
  contactsCount: number;
  draftsCount: number;
  sentCount: number;
}

export default function CampaignTimeline({
  campaignId,
  campaignName,
  universitiesCount,
  contactsCount,
  draftsCount,
  sentCount,
}: CampaignTimelineProps) {
  const steps = [
    {
      id: 1,
      label: "Created",
      icon: Megaphone,
      href: `/campaigns/${campaignId}`,
      status: "done" as const,
      count: null,
    },
    {
      id: 2,
      label: "Institutions",
      icon: Search,
      href: `/campaigns/${campaignId}/finder`,
      status: universitiesCount > 0 ? ("done" as const) : ("current" as const),
      count: universitiesCount || null,
    },
    {
      id: 3,
      label: "Contacts",
      icon: Users,
      href: `/campaigns/${campaignId}/contacts`,
      status:
        universitiesCount === 0
          ? ("pending" as const)
          : contactsCount > 0
          ? ("done" as const)
          : ("current" as const),
      count: contactsCount || null,
    },
    {
      id: 4,
      label: "Drafts",
      icon: FileText,
      href: `/campaigns/${campaignId}/drafts`,
      status:
        contactsCount === 0
          ? ("pending" as const)
          : draftsCount > 0
          ? ("done" as const)
          : ("current" as const),
      count: draftsCount || null,
    },
    {
      id: 5,
      label: "Sent",
      icon: Send,
      href: `/campaigns/${campaignId}`,
      status:
        draftsCount === 0
          ? ("pending" as const)
          : sentCount > 0
          ? ("done" as const)
          : ("current" as const),
      count: sentCount || null,
    },
  ];

  const completedCount = steps.filter((s) => s.status === "done").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-10 shadow-sm">
      <div className="max-w-4xl mx-auto">
        {/* Campaign name + progress */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-500 truncate max-w-xs">
            {campaignName}
          </p>
          <p className="text-xs text-slate-400 shrink-0 ml-2">
            {progressPercent}% complete
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1 mb-3">
          <div
            className="bg-blue-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timeline steps */}
        <div className="flex items-center justify-between relative">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-3 h-px bg-slate-200 z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isClickable =
              step.status === "done" || step.status === "current";

            const stepContent = (
              <div className="flex flex-col items-center gap-1 relative z-10">
                {/* Step icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.status === "done"
                      ? "bg-green-500 border-green-500 text-white"
                      : step.status === "current"
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-slate-300 text-slate-300"
                  }`}
                >
                  {step.status === "done" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>

                {/* Step label */}
                <span
                  className={`text-xs font-medium ${
                    step.status === "done"
                      ? "text-green-600"
                      : step.status === "current"
                      ? "text-blue-600"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </span>

                {/* Count badge */}
                {step.count !== null && step.count > 0 && (
                  <span className="text-xs text-slate-400">
                    ({step.count})
                  </span>
                )}
              </div>
            );

            return isClickable ? (
              <Link key={step.id} href={step.href} className="hover:opacity-80 transition-opacity">
                {stepContent}
              </Link>
            ) : (
              <div key={step.id} className="cursor-not-allowed opacity-60">
                {stepContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}