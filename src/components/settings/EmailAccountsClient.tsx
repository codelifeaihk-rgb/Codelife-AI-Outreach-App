"use client";

// src/components/settings/EmailAccountsClient.tsx
// Client component — manages email accounts list with disconnect support.

import { useState } from "react";
import EmailAccountCard from "./EmailAccountCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailAccount {
  id: string;
  email: string;
  displayName: string | null; 
  provider: string;
  status: string;
  isDefault: boolean;
  accessTokenExpiresAt: string | null;
  createdAt: string;
}

export default function EmailAccountsClient({
  initialAccounts,
}: {
  initialAccounts: EmailAccount[];
}) {
  const [accounts, setAccounts] = useState(initialAccounts);

  async function handleDisconnect(accountId: string) {
    const res = await fetch("/api/email-accounts/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });

    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    }
  }

  if (accounts.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-400" />
          Connected Accounts ({accounts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {accounts.map((account) => (
          <EmailAccountCard
            key={account.id}
            account={account}
            onDisconnect={handleDisconnect}
          />
        ))}
      </CardContent>
    </Card>
  );
}