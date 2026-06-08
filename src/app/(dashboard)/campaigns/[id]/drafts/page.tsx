// src/app/(dashboard)/campaigns/[id]/drafts/page.tsx
// Draft Generation page — generate, review and approve email drafts.
// Human approval is required before any email can be sent.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CampaignTimeline from "@/src/components/campaigns/CampaignTimeline";
import DraftPageClient from "@/src/components/campaigns/DraftPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftsPage({ params }: PageProps) {
  const { id } = await params;
  const dbUser = await requireDbUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      contacts: {
        include: { sources: true },
        orderBy: [
          { isDecisionMaker: "desc" },
          { fitScore: "desc" },
        ],
      },
      drafts: {
        include: {
          contact: {
            select: {
              fullName: true,
              email: true,
              role: true,
              institutionName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      universities: true,
      sentEmails: true,
    },
  });

  if (!campaign) redirect("/campaigns");

  if (campaign.contacts.length === 0) {
    return (
      <div className="space-y-0">
        <CampaignTimeline
          campaignId={campaign.id}
          campaignName={campaign.name}
          universitiesCount={campaign.universities.length}
          contactsCount={campaign.contacts.length}
          draftsCount={campaign.drafts.length}
          sentCount={campaign.sentEmails.length}
        />
        <div className="p-6 space-y-4">
          <Link
            href={`/campaigns/${id}`}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaign
          </Link>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-6 text-center">
              <FileText className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-700 font-medium">
                No contacts discovered yet
              </p>
              <p className="text-amber-600 text-sm mt-1">
                Please{" "}
                <Link
                  href={`/campaigns/${id}/contacts`}
                  className="underline"
                >
                  discover contacts
                </Link>{" "}
                before generating drafts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <CampaignTimeline
        campaignId={campaign.id}
        campaignName={campaign.name}
        universitiesCount={campaign.universities.length}
        contactsCount={campaign.contacts.length}
        draftsCount={campaign.drafts.length}
        sentCount={campaign.sentEmails.length}
      />
      <div className="p-6 space-y-6">
        <Link
          href={`/campaigns/${id}`}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </Link>

        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-slate-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Draft Generation
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Generate personalised email drafts. Review and approve
              before sending.
            </p>
          </div>
        </div>

        <DraftPageClient
  campaignId={campaign.id}
  audienceMode={campaign.audienceMode}
  contacts={campaign.contacts.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    email: c.email,
    role: c.role,
    department: c.department,
    institutionName: c.institutionName,
    fitScore: c.fitScore ? Number(c.fitScore) : null,
    isDecisionMaker: c.isDecisionMaker,
  }))}
  initialDrafts={campaign.drafts.map((d) => ({
    id: d.id,
    subject: d.subject,
    bodyHtml: d.bodyHtml,
    bodyText: d.bodyText ?? undefined,
    status: d.status,
    personalizationReason: d.personalizationReason ?? undefined,
    qualityScore: d.qualityScore 
      ? (d.qualityScore as unknown as QualityScore) 
      : undefined,
    targetLanguage: d.targetLanguage ?? undefined,
    version: d.version,
    contact: d.contact,
  }))}
 />
      </div>
    </div>
  );
}

interface QualityScore {
  overall: number;
  subjectClarity: number;
  spamRisk: number;
  length: number;
  tone: number;
  ctaClarity: number;
}