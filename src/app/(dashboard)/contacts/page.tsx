// src/app/(dashboard)/contacts/page.tsx
// All contacts across all campaigns with search and filter.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Star } from "lucide-react";

export default async function ContactsPage() {
  const dbUser = await requireDbUser();

  const contacts = await prisma.contact.findMany({
    where: { userId: dbUser.id },
    include: {
      campaign: { select: { name: true } },
      sources: { take: 1 },
    },
    orderBy: [
      { isDecisionMaker: "desc" },
      { fitScore: "desc" },
      { createdAt: "desc" },
    ],
  });

  const leadStatusColors: Record<string, string> = {
    discovered: "bg-slate-100 text-slate-600",
    contacted: "bg-blue-100 text-blue-700",
    replied: "bg-green-100 text-green-700",
    interested: "bg-purple-100 text-purple-700",
    converted: "bg-emerald-100 text-emerald-700",
    not_interested: "bg-red-100 text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Contacts</h2>
          <p className="text-slate-500 text-sm mt-1">
            {contacts.length} contacts across all campaigns
          </p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No contacts yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Discover contacts from your campaigns to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="hover:shadow-sm transition-shadow"
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">
                        {contact.fullName}
                      </p>
                      {contact.isDecisionMaker && (
                        <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                          <Star className="w-2.5 h-2.5 mr-1" />
                          Decision Maker
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                      {contact.role && <span>{contact.role}</span>}
                      {contact.institutionName && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {contact.institutionName}
                          </span>
                        </>
                      )}
                      {contact.email && (
                        <>
                          <span>·</span>
                          <span className="text-blue-500 font-mono">
                            {contact.email}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Campaign: {contact.campaign.name}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {contact.fitScore && (
                      <span className="text-xs font-medium text-slate-600">
                        Fit: {Number(contact.fitScore).toFixed(0)}/100
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        leadStatusColors[contact.leadStatus] ??
                        leadStatusColors.discovered
                      }`}
                    >
                      {contact.leadStatus}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}