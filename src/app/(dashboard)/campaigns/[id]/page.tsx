// src/app/(dashboard)/campaigns/[id]/page.tsx
// Campaign detail page — shows overview, stats, and action cards.
// Links to University/School Finder, Contact Discovery, and Draft Generation.

import DeleteCampaignButton from "@/src/components/campaigns/DeleteCampaignButton";
import CampaignProgress from "@/src/components/campaigns/CampaignProgress";
import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  School,
  Search,
  Users,
  Mail,
  ArrowLeft,
  Globe,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const dbUser = await requireDbUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      universities: true,
      contacts: true,
      drafts: true,
    },
  });

  if (!campaign) redirect("/campaigns");

  const isUniversity = campaign.audienceMode === "university";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/campaigns"
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      {/* Campaign header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            {isUniversity ? (
              <GraduationCap className="w-5 h-5 text-slate-600" />
            ) : (
              <School className="w-5 h-5 text-slate-600" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {campaign.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={
                  isUniversity
                    ? "border-blue-200 text-blue-700 bg-blue-50"
                    : "border-green-200 text-green-700 bg-green-50"
                }
              >
                {isUniversity ? "University Mode" : "School Mode"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  campaign.status === "active"
                    ? "border-green-200 text-green-700"
                    : "border-slate-200 text-slate-600"
                }
              >
                {campaign.status}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Globe className="w-3 h-3" />
                {campaign.targetCountry}
              </span>
            </div>
          </div>
        </div>

        <DeleteCampaignButton campaignId={campaign.id} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {campaign.universities.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Institutions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {campaign.contacts.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-slate-900">
              {campaign.drafts.length}
            </p>
            <p className="text-xs text-slate-400 mt-1">Drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign progress */}
      <Card>
        <CardContent className="py-5">
          <CampaignProgress
            universitiesCount={campaign.universities.length}
            contactsCount={campaign.contacts.length}
            draftsCount={campaign.drafts.length}
            sentCount={0}
          />
        </CardContent>
      </Card>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Find institutions */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              {isUniversity ? "University Finder" : "School Finder"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">
              {isUniversity
                ? "Discover universities with biomedical and biotech strength."
                : "Find schools with STEM and innovation programs."}
            </p>
            <Link href={`/campaigns/${campaign.id}/finder`}>
              <Button size="sm" className="w-full">
                {campaign.universities.length > 0
                  ? `Find More (${campaign.universities.length} saved)`
                  : "Start Finding"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Contact discovery */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Contact Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">
              {isUniversity
                ? "Find professors, postdocs, research assistants, and decision makers at saved institutions."
                : "Find school leaders, science coordinators, and curriculum decision-makers."}
            </p>
            <Link href={`/campaigns/${campaign.id}/contacts`}>
              <Button
                size="sm"
                className="w-full"
                variant={
                  campaign.universities.length === 0 ? "outline" : "default"
                }
                disabled={campaign.universities.length === 0}
              >
                {campaign.contacts.length > 0
                  ? `View ${campaign.contacts.length} Contacts`
                  : "Discover Contacts"}
              </Button>
            </Link>
            {campaign.universities.length === 0 && (
              <p className="text-xs text-amber-500 mt-1.5 text-center">
                Find institutions first
              </p>
            )}
          </CardContent>
        </Card>

        {/* Draft Generation */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-500" />
              Draft Generation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">
              Generate personalized outreach emails for each contact.
            </p>

            <Link href={`/campaigns/${campaign.id}/drafts`}>
              <Button
                size="sm"
                className="w-full"
                variant={campaign.contacts.length === 0 ? "outline" : "default"}
                disabled={campaign.contacts.length === 0}
              >
                {campaign.drafts.length > 0
                  ? `View ${campaign.drafts.length} Drafts`
                  : "Generate Drafts"}
              </Button>
            </Link>

            {campaign.contacts.length === 0 && (
              <p className="text-xs text-amber-500 mt-1.5 text-center">
                Discover contacts first
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Audience Mode</span>
            <span className="font-medium capitalize">
              {campaign.audienceMode}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target Country</span>
            <span className="font-medium">{campaign.targetCountry}</span>
          </div>
          {campaign.targetInstitution && (
            <div className="flex justify-between">
              <span className="text-slate-400">Target Institution</span>
              <span className="font-medium">{campaign.targetInstitution}</span>
            </div>
          )}
          {campaign.targetDepartment && (
            <div className="flex justify-between">
              <span className="text-slate-400">Target Department</span>
              <span className="font-medium">{campaign.targetDepartment}</span>
            </div>
          )}
          {campaign.targetLanguage && (
            <div className="flex justify-between">
              <span className="text-slate-400">Target Language</span>
              <span className="font-medium">{campaign.targetLanguage}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-400">Compliance Mode</span>
            <span className="font-medium">
              {campaign.complianceMode ? "✅ Enabled" : "❌ Disabled"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}