// src/app/(dashboard)/settings/email-accounts/page.tsx
// Email account connection page — connect Gmail for sending outreach emails.

import { requireDbUser } from "@/src/lib/clerk-user";
import { prisma } from "@/src/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SearchParams {
  connected?: string;
  error?: string;
}

export default async function EmailAccountsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const dbUser = await requireDbUser();
  const sp = await searchParams;

  const accounts = await prisma.emailAccount.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  const isExpired = (expiresAt: Date | null) =>
    expiresAt ? expiresAt < new Date() : false;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          Sender Email Accounts
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Connect your Gmail or Google Workspace account to send outreach
          emails directly from CodeLife Outreach.
        </p>
      </div>

      {/* Success / error messages */}
      {sp.connected === "true" && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700">
            Gmail account connected successfully.
          </p>
        </div>
      )}
      {sp.error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-600">
            Connection failed: {sp.error}. Please try again.
          </p>
        </div>
      )}

      {/* Connect new account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Connect Gmail Account
          </CardTitle>
          <CardDescription>
            CodeLife Outreach will send emails on your behalf after you
            approve each draft. We only request permission to send — we
            cannot read your inbox.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/api/email-accounts/connect">
            <Button className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Connect Gmail / Google Workspace
            </Button>
          </Link>
          <p className="text-xs text-slate-400 mt-2">
            Only the{" "}
            <code className="bg-slate-100 px-1 rounded">gmail.send</code>{" "}
            scope is requested — we cannot read your emails.
          </p>
        </CardContent>
      </Card>

      {/* Connected accounts */}
      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {account.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      Connected{" "}
                      {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpired(account.accessTokenExpiresAt) ? (
                    <Badge
                      variant="outline"
                      className="text-red-600 border-red-200 text-xs"
                    >
                      Expired
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-200 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {account.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}