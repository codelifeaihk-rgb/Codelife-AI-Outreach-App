// Contacts page — discovered contacts across campaigns (Clerk-protected).

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function ContactsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Contacts</h2>
        <p className="text-slate-500 text-sm mt-1">
          All discovered contacts from your campaigns.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-10 h-10 text-slate-300 mb-4" />
          <h3 className="text-slate-700 font-medium mb-1">No contacts yet</h3>
          <p className="text-slate-400 text-sm">
            Create a campaign and run contact discovery to see contacts here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
