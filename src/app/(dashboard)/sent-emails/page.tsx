// src/app/(dashboard)/sent-emails/page.tsx
// Shows full sent email history with open/click tracking status.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Eye,
  MousePointer,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

export default async function SentEmailsPage() {
  const dbUser = await requireDbUser();

  const sentEmails = await prisma.sentEmail.findMany({
    where: { userId: dbUser.id },
    include: {
      contact: {
        select: {
          fullName: true,
          role: true,
          institutionName: true,
        },
      },
      campaign: {
        select: { name: true },
      },
      emailAccount: {
        select: { email: true, provider: true },
      },
      events: {
        select: { eventType: true, occurredAt: true },
        orderBy: { occurredAt: "asc" },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  const statusConfig: Record<string, { label: string; color: string; Icon: any }> = {
    sent: {
      label: "Sent",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      Icon: Mail,
    },
    opened: {
      label: "Opened",
      color: "bg-green-100 text-green-700 border-green-200",
      Icon: Eye,
    },
    clicked: {
      label: "Clicked",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      Icon: MousePointer,
    },
    failed: {
      label: "Failed",
      color: "bg-red-100 text-red-700 border-red-200",
      Icon: XCircle,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sent Emails</h2>
        <p className="text-slate-500 text-sm mt-1">
          Full history of all outreach emails sent from CodeLife Outreach.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Sent",
            value: sentEmails.length,
            color: "text-blue-700",
            bg: "bg-blue-50",
          },
          {
            label: "Opened",
            value: sentEmails.filter((e) => e.status === "opened").length,
            color: "text-green-700",
            bg: "bg-green-50",
          },
          {
            label: "Clicked",
            value: sentEmails.filter((e) => e.status === "clicked").length,
            color: "text-purple-700",
            bg: "bg-purple-50",
          },
          {
            label: "Failed",
            value: sentEmails.filter((e) => e.status === "failed").length,
            color: "text-red-700",
            bg: "bg-red-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Email list */}
      {sentEmails.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Mail className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No emails sent yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Approve and send drafts from your campaigns to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sentEmails.map((email) => {
            const config =
              statusConfig[email.status] ?? statusConfig.sent;
            const { Icon } = config;
            const opened = email.events.some(
              (e) => e.eventType === "opened"
            );
            const clicked = email.events.some(
              (e) => e.eventType === "clicked"
            );

            return (
              <Card key={email.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Subject */}
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {email.subject}
                      </p>

                      {/* Recipient */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-blue-500 font-mono">
                          {email.recipientEmail}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {email.contact.fullName}
                        </span>
                        {email.contact.institutionName && (
                          <>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400">
                              {email.contact.institutionName}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Campaign + account */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">
                          Campaign: {email.campaign.name}
                        </span>
                        {email.emailAccount && (
                          <>
                            <span className="text-xs text-slate-300">|</span>
                            <span className="text-xs text-slate-400">
                              From: {email.emailAccount.email}
                            </span>
                          </>
                        )}
                        {email.sentAt && (
                          <>
                            <span className="text-xs text-slate-300">|</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(email.sentAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status + tracking */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${config.color}`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>

                      <div className="flex gap-1">
                        {opened && (
                          <span className="flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                            <Eye className="w-3 h-3" />
                            Opened
                          </span>
                        )}
                        {clicked && (
                          <span className="flex items-center gap-0.5 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            <MousePointer className="w-3 h-3" />
                            Clicked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}