// Sent emails page — tracks approved and sent outreach (Clerk-protected).

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default async function SentEmailsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Sent Emails</h2>
        <p className="text-slate-500 text-sm mt-1">
          Track all approved and sent outreach emails.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Mail className="w-10 h-10 text-slate-300 mb-4" />
          <h3 className="text-slate-700 font-medium mb-1">No emails sent yet</h3>
          <p className="text-slate-400 text-sm">
            Approve email drafts in a campaign to send and track them here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
