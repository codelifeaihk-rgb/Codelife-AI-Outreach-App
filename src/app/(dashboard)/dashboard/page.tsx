// Main dashboard — outreach stats for the signed-in user (Prisma user scoped by Clerk).

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/db";
import { getDbUser } from "@/src/lib/clerk-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone, Users, Mail, Bell } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  const user = await currentUser();
  const userEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    dbUser.email;

  const userIdDb = dbUser.id;

  const [campaignCount, contactCount, sentEmailCount] = await Promise.all([
    prisma.campaign.count({ where: { userId: userIdDb } }),
    prisma.contact.count({ where: { userId: userIdDb } }),
    prisma.sentEmail.count({ where: { userId: userIdDb } }),
  ]);

  const followUpCount = await prisma.contact.count({
    where: {
      userId: userIdDb,
      followUpAt: { lte: new Date() },
    },
  });

  const stats = [
    {
      label: "Campaigns",
      value: campaignCount,
      icon: Megaphone,
      description: "Active campaigns",
    },
    {
      label: "Contacts",
      value: contactCount,
      icon: Users,
      description: "Discovered contacts",
    },
    {
      label: "Emails Sent",
      value: sentEmailCount,
      icon: Mail,
      description: "Approved and sent",
    },
    {
      label: "Follow-ups Due",
      value: followUpCount,
      icon: Bell,
      description: "Pending follow-ups",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {userEmail}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Here is your outreach overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {label}
              </CardTitle>
              <Icon className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
