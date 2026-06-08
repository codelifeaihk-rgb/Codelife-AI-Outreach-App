// src/app/(dashboard)/campaigns/[id]/finder/page.tsx

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, School } from "lucide-react";
import FinderFilters from "@/src/components/campaigns/FinderFilters";
import CampaignTimeline from "@/src/components/campaigns/CampaignTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FinderPage({ params }: PageProps) {
  const { id } = await params;
  const dbUser = await requireDbUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      universities: true,
      contacts: true,
      drafts: true,
      sentEmails: true,
    },
  });

  if (!campaign) redirect("/campaigns");

  const isUniversity = campaign.audienceMode === "university";

  return (
    <div className="space-y-0">
      {/* Persistent timeline */}
      <CampaignTimeline
        campaignId={campaign.id}
        campaignName={campaign.name}
        universitiesCount={campaign.universities.length}
        contactsCount={campaign.contacts.length}
        draftsCount={campaign.drafts.length}
        sentCount={campaign.sentEmails.length}
      />

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          {isUniversity ? (
            <GraduationCap className="w-6 h-6 text-slate-600" />
          ) : (
            <School className="w-6 h-6 text-slate-600" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {isUniversity ? "University Finder" : "School Finder"}
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isUniversity
                ? "Find universities with strong biomedical, biotech, or AI focus."
                : "Find schools with strong STEM, biotech, or innovation programmes."}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              isUniversity
                ? "ml-auto border-blue-200 text-blue-700 bg-blue-50"
                : "ml-auto border-green-200 text-green-700 bg-green-50"
            }
          >
            {isUniversity ? "University Mode" : "School Mode"}
          </Badge>
        </div>

        {/* Saved institutions */}
        {campaign.universities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Saved Institutions ({campaign.universities.length})
              </CardTitle>
              <CardDescription>
                These institutions have been added to your campaign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {campaign.universities.map((uni) => (
                  <div
                    key={uni.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {uni.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {uni.country}
                        {uni.recommendationNote
                          ? ` · ${uni.recommendationNote.slice(0, 60)}...`
                          : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {uni.institutionKind}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Finder filters */}
        <FinderFilters
          campaignId={campaign.id}
          audienceMode={campaign.audienceMode}
          defaultCountry={campaign.targetCountry}
          defaultDepartment={campaign.targetDepartment ?? ""}
        />
      </div>
    </div>
  );
}