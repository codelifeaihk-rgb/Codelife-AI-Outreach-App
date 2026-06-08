// Export page — export campaign data (Clerk-protected).

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

export default async function ExportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Export</h2>
        <p className="text-slate-500 text-sm mt-1">
          Export campaign and contact data to CSV, Google Sheets, or CRM formats.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Download className="w-10 h-10 text-slate-300 mb-4" />
          <h3 className="text-slate-700 font-medium mb-1">Nothing to export yet</h3>
          <p className="text-slate-400 text-sm">
            Send emails from a campaign to enable export of outreach data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
