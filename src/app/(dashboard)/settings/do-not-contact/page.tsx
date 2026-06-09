// src/app/(dashboard)/settings/do-not-contact/page.tsx

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import DoNotContactClient from "@/src/components/settings/DoNotContactClient";
import { ShieldOff } from "lucide-react";

export default async function DoNotContactPage() {
  const dbUser = await requireDbUser();

  const entries = await prisma.doNotContact.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <ShieldOff className="w-6 h-6 text-red-400" />
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Do Not Contact
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Emails on this list are permanently blocked from all outreach.
          </p>
        </div>
      </div>

      <DoNotContactClient
        initialEntries={entries.map((e) => ({
          id: e.id,
          email: e.email,
          reason: e.reason,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}