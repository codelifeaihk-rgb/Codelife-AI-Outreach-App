"use client";

// src/components/settings/EmailAccountCard.tsx
// Shows a connected email account with status and disconnect option.

"use client";

// src/components/settings/EmailAccountCard.tsx
// Displays a connected email account with disconnect option.

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";

interface EmailAccount {
  id: string;
  email: string;
  displayName: string | null;
  provider: string;
  status: string;
  isDefault: boolean;
  accessTokenExpiresAt: string | null;
}

interface EmailAccountCardProps {
  account: EmailAccount;
  onDisconnect: (id: string) => Promise<void>;
}

export default function EmailAccountCard({
  account,
  onDisconnect,
}: EmailAccountCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const isExpired =
    account.accessTokenExpiresAt &&
    new Date(account.accessTokenExpiresAt) < new Date();

  const isGoogle = account.provider === "google";

  async function handleDisconnect() {
    setDisconnecting(true);
    await onDisconnect(account.id);
    setDisconnecting(false);
  }

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center gap-3">
        {/* Provider icon */}
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
          {isGoogle ? (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#0078d4" d="M11.5 2L2 7v10l9.5 5 9.5-5V7z"/>
            </svg>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-900">
            {account.email}
          </p>
          <p className="text-xs text-slate-400">
            {isGoogle ? "Gmail" : "Microsoft Outlook"} ·{" "}
            {account.isDefault ? "Default sender" : "Secondary"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isExpired ? (
          <Badge variant="outline" className="text-red-600 border-red-200 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        ) : (
          <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        )}

        {confirmDisconnect ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-600">Sure?</span>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="h-7 px-2 text-xs"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                "Yes"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmDisconnect(false)}
              className="h-7 px-2 text-xs"
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2"
            onClick={() => setConfirmDisconnect(true)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}