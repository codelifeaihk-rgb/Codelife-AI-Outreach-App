// src/app/(dashboard)/export/page.tsx
// Export page — download contacts and sent emails as CSV.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Download, Users, Mail, FileText } from "lucide-react";
import ExportClient from "@/src/components/export/ExportClient";

export default async function ExportPage() {
  const dbUser = await requireDbUser();

  const [campaigns, contactCount, sentCount] = await Promise.all([
    prisma.campaign.findMany({
      where: { userId: dbUser.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.count({ where: { userId: dbUser.id } }),
    prisma.sentEmail.count({ where: { userId: dbUser.id } }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Export Data</h2>
        <p className="text-slate-500 text-sm mt-1">
          Download your contacts and sent email data as CSV files.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {contactCount}
                </p>
                <p className="text-xs text-slate-500">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {sentCount}
                </p>
                <p className="text-xs text-slate-500">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ExportClient campaigns={campaigns} />
    </div>
  );
}