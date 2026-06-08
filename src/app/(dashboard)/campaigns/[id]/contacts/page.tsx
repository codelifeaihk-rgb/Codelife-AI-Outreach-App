// src/app/(dashboard)/campaigns/[id]/contacts/page.tsx
// Contact Discovery page — finds public contacts at saved institutions.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import ContactDiscovery from "@/src/components/campaigns/ContactDiscovery";
import CampaignTimeline from "@/src/components/campaigns/CampaignTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactsPage({ params }: PageProps) {
  const { id } = await params;
  const dbUser = await requireDbUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      universities: true,
      contacts: {
        include: { sources: true },
        orderBy: { fitScore: "desc" },
      },
      drafts: true,
      sentEmails: true,
    },
  });

  if (!campaign) redirect("/campaigns");

  const isUniversity = campaign.audienceMode === "university";

  return (
    <div className="space-y-0">
      {/* Campaign Timeline */}
      <CampaignTimeline
        campaignId={campaign.id}
        campaignName={campaign.name}
        universitiesCount={campaign.universities.length}
        contactsCount={campaign.contacts.length}
        draftsCount={campaign.drafts.length}
        sentCount={campaign.sentEmails.length}
      />

      <div className="space-y-6 p-6">
        {/* Back button */}
        <Link
          href={`/campaigns/${id}`}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaign
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-slate-600" />
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Contact Discovery
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              {isUniversity
                ? "Find professors, lab heads, department leaders, research assistants, postdocs, and PhD researchers."
                : "Find school leaders, science coordinators, and curriculum decision-makers."}
            </p>
          </div>
        </div>

        {/* No institutions warning */}
        {campaign.universities.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <p className="text-sm text-amber-700">
                No institutions saved yet. Please use the{" "}
                <Link
                  href={`/campaigns/${id}/finder`}
                  className="underline font-medium"
                >
                  {isUniversity ? "University Finder" : "School Finder"}
                </Link>{" "}
                first to add institutions before discovering contacts.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Discovery form */}
        {campaign.universities.length > 0 && (
          <ContactDiscovery
            campaignId={campaign.id}
            audienceMode={campaign.audienceMode}
            institutions={campaign.universities.map((u) => ({
              id: u.id,
              name: u.name,
              country: u.country,
              websiteUrl: u.websiteUrl ?? "",
            }))}
          />
        )}

        {/* Saved contacts */}
        {campaign.contacts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-800">
              Discovered Contacts ({campaign.contacts.length})
            </h3>

            {campaign.contacts.map((contact) => (
              <Card key={contact.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      {/* Name + decision maker badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900">
                          {contact.fullName}
                        </h3>
                        {contact.isDecisionMaker && (
                          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                            Decision Maker
                          </Badge>
                        )}
                      </div>

                      {/* Role + institution */}
                      <p className="text-sm text-slate-500">
                        {contact.role && <span className="font-medium">{contact.role}</span>}
                        {contact.role && contact.institutionName && " · "}
                        {contact.institutionName && <span>{contact.institutionName}</span>}
                        {contact.department && (
                          <span className="text-slate-400"> · {contact.department}</span>
                        )}
                      </p>

                      {/* Email */}
                      {contact.email && (
                        <p className="text-sm text-blue-600 font-mono">{contact.email}</p>
                      )}

                      {/* Why this fit */}
                      {contact.fitExplanation && (
                        <div className="bg-slate-50 rounded-lg p-2.5">
                          <p className="text-xs text-slate-500 font-medium mb-1">
                            Why this fit?
                          </p>
                          <p className="text-xs text-slate-600">{contact.fitExplanation}</p>
                        </div>
                      )}

                      {/* Source URLs */}
                      {contact.sources.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {contact.sources.map((source) => (
                            <a
                              key={source.id}
                              href={source.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {source.sourceType ?? "Source"}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fit score */}
                    {contact.fitScore && (
                      <div className="text-center shrink-0">
                        <p className="text-2xl font-bold text-slate-900">
                          {Number(contact.fitScore).toFixed(0)}
                        </p>
                        <p className="text-xs text-slate-400">Fit Score</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}