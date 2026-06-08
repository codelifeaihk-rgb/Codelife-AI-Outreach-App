// src/app/(dashboard)/campaigns/new/page.tsx
// Campaign creation with natural language description and file upload.
// AI auto-fills form fields from description or uploaded file.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { requireDbUser } from "@/src/lib/clerk-user";
import NewCampaignForm from "@/src/components/campaigns/NewCampaignForm";

export default async function NewCampaignPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const dbUser = await requireDbUser();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">New Campaign</h2>
        <p className="text-slate-500 text-sm mt-1">
          Describe your outreach goal or fill in the form manually.
        </p>
      </div>
      <NewCampaignForm userId={dbUser.id} />
    </div>
  );
}