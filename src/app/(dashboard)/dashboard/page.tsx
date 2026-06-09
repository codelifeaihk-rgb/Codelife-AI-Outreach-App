// src/app/(dashboard)/dashboard/page.tsx
// Real-time dashboard with campaign stats, email tracking, and recent activity.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import {
  Megaphone,
  Users,
  Mail,
  Eye,
  MousePointer,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import StatsCard from "@/src/components/dashboard/StatsCard";
import RecentActivity from "@/src/components/dashboard/RecentActivity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const dbUser = await requireDbUser();

  // Fetch all stats in parallel
  const [
    campaignCount,
    institutionCount,
    contactCount,
    draftCount,
    approvedDraftCount,
    sentEmailCount,
    openedEmailCount,
    clickedEmailCount,
    recentEvents,
    recentCampaigns,
  ] = await Promise.all([
    prisma.campaign.count({ where: { userId: dbUser.id } }),
    prisma.university.count({
      where: { campaign: { userId: dbUser.id } },
    }),
    prisma.contact.count({ where: { userId: dbUser.id } }),
    prisma.emailDraft.count({
      where: { campaign: { userId: dbUser.id } },
    }),
    prisma.emailDraft.count({
      where: { campaign: { userId: dbUser.id }, status: "approved" },
    }),
    prisma.sentEmail.count({ where: { userId: dbUser.id } }),
    prisma.sentEmail.count({
      where: { userId: dbUser.id, status: "opened" },
    }),
    prisma.sentEmail.count({
      where: { userId: dbUser.id, status: "clicked" },
    }),
    // Recent email events with join
    prisma.emailEvent.findMany({
      where: {
        sentEmail: { userId: dbUser.id },
      },
      include: {
        sentEmail: {
          select: {
            recipientEmail: true,
            subject: true,
          },
        },
      },
      orderBy: { occurredAt: "desc" },
      take: 10,
    }),
    // Recent campaigns
    prisma.campaign.findMany({
      where: { userId: dbUser.id },
      include: {
        _count: {
          select: {
            contacts: true,
            drafts: true,
            sentEmails: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const openRate =
    sentEmailCount > 0
      ? Math.round((openedEmailCount / sentEmailCount) * 100)
      : 0;

  const clickRate =
    sentEmailCount > 0
      ? Math.round((clickedEmailCount / sentEmailCount) * 100)
      : 0;

  const activityItems = recentEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    recipientEmail: e.sentEmail.recipientEmail,
    subject: e.sentEmail.subject,
    occurredAt: e.occurredAt,
  }));

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back. Here is your outreach overview.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Primary stats */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Campaign Overview
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Campaigns"
            value={campaignCount}
            icon={Megaphone}
            color="blue"
          />
          <StatsCard
            label="Institutions"
            value={institutionCount}
            icon={Building2}
            color="purple"
          />
          <StatsCard
            label="Contacts"
            value={contactCount}
            icon={Users}
            color="amber"
          />
          <StatsCard
            label="Drafts"
            value={draftCount}
            icon={FileText}
            color="blue"
            sub={`${approvedDraftCount} approved`}
          />
        </div>
      </div>

      {/* Email tracking stats */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Email Performance
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Emails Sent"
            value={sentEmailCount}
            icon={Mail}
            color="blue"
          />
          <StatsCard
            label="Opened"
            value={openedEmailCount}
            icon={Eye}
            color="green"
            sub={`${openRate}% open rate`}
          />
          <StatsCard
            label="Clicked"
            value={clickedEmailCount}
            icon={MousePointer}
            color="purple"
            sub={`${clickRate}% click rate`}
          />
          <StatsCard
            label="Approved"
            value={approvedDraftCount}
            icon={CheckCircle2}
            color="green"
            sub="ready to send"
          />
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent activity */}
        <RecentActivity items={activityItems} />

        {/* Recent campaigns */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Campaigns</CardTitle>
              <Link
                href="/campaigns"
                className="text-xs text-blue-500 hover:underline"
              >
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCampaigns.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 mb-3">
                  No campaigns yet.
                </p>
                <Link href="/campaigns/new">
                  <Button size="sm" variant="outline">
                    Create your first campaign
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {campaign._count.contacts} contacts ·{" "}
                        {campaign._count.sentEmails} sent
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ml-3 ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}