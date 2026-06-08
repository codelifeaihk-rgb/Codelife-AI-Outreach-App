// Top navigation bar — user email from Clerk and UserButton for profile / sign-out.

import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { Mail, AlertCircle } from "lucide-react";

export default async function TopNav() {
  const user = await currentUser();
  const userEmail =
    user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
      ?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "Unknown user";

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <div className="text-sm text-slate-500">CodeLife Outreach</div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
          <AlertCircle className="w-3 h-3" />
          No sender email connected
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Mail className="w-4 h-4 text-slate-400" />
          {userEmail}
        </div>

        <UserButton />
      </div>
    </header>
  );
}
