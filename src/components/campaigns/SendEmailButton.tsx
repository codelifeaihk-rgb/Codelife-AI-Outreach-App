"use client";

// src/components/campaigns/SendEmailButton.tsx
// Send button for approved drafts.
// Shows email account selector if multiple accounts connected.
// Handles loading, success, and error states.

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

interface EmailAccount {
  id: string;
  email: string;
  provider: string;
  isDefault: boolean;
}

interface SendEmailButtonProps {
  campaignId: string;
  draftId: string;
  recipientEmail: string;
  disabled?: boolean;
  onSent?: () => void;
}

export default function SendEmailButton({
  campaignId,
  draftId,
  recipientEmail,
  disabled,
  onSent,
}: SendEmailButtonProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Load connected email accounts
  useEffect(() => {
    fetch("/api/email-accounts")
      .then((r) => r.json())
      .then((data) => {
        const accs = data.accounts ?? [];
        setAccounts(accs);
        // Auto-select default account
        const defaultAcc = accs.find((a: EmailAccount) => a.isDefault);
        if (defaultAcc) setSelectedAccountId(defaultAcc.id);
        else if (accs.length > 0) setSelectedAccountId(accs[0].id);
      })
      .catch(() => console.error("Failed to load email accounts"));
  }, []);

  async function handleSend() {
    if (!selectedAccountId) {
      setErrorMessage(
        "No email account connected. Go to Settings → Email Accounts."
      );
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          emailAccountId: selectedAccountId,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("sent");
        onSent?.();
      } else {
        setErrorMessage(data.error ?? "Send failed. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
      setStatus("error");
    }
  }

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  if (status === "sent") {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle2 className="w-4 h-4" />
        <span>Sent to {recipientEmail}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Account selector */}
      {accounts.length > 1 && (
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-md px-2 py-1.5 bg-white"
          >
            <span>
              Send from:{" "}
              <strong>{selectedAccount?.email ?? "Select account"}</strong>
            </span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showSelector && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-64">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setShowSelector(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-slate-50 first:rounded-t-lg last:rounded-b-lg ${
                    acc.id === selectedAccountId ? "bg-blue-50" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {/* Provider icon */}
                    <span className="text-xs">
                      {acc.provider === "google" ? "📧" : "📨"}
                    </span>
                    {acc.email}
                  </span>
                  <div className="flex gap-1">
                    {acc.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                    {acc.id === selectedAccountId && (
                      <CheckCircle2 className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single account display */}
      {accounts.length === 1 && selectedAccount && (
        <p className="text-xs text-slate-400">
          Sending from:{" "}
          <span className="font-medium text-slate-600">
            {selectedAccount.email}
          </span>
        </p>
      )}

      {/* No accounts connected */}
      {accounts.length === 0 && (
        <p className="text-xs text-amber-600">
          No email account connected.{" "}
          
            <a href="/settings/email-accounts"
            className="underline"
          >
            Connect one in Settings
          </a>
        </p>
      )}

      {/* Error message */}
      {status === "error" && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-md p-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Send button */}
      <Button
        size="sm"
        onClick={handleSend}
        disabled={
          disabled ||
          status === "sending" ||
          accounts.length === 0 ||
          !selectedAccountId
        }
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-3 h-3 mr-2" />
            Send to {recipientEmail}
          </>
        )}
      </Button>
    </div>
  );
}