"use client";

// src/components/settings/DoNotContactClient.tsx
// Client component — manage Do Not Contact list.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Plus,
  AlertCircle,
  Loader2,
  ShieldOff,
} from "lucide-react";

interface DNCEntry {
  id: string;
  email: string;
  reason: string | null;
  createdAt: string;
}

export default function DoNotContactClient({
  initialEntries,
}: {
  initialEntries: DNCEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleAdd() {
    if (!newEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setAdding(true);
    setError("");

    const res = await fetch("/api/do-not-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, reason: newReason }),
    });

    const data = await res.json();

    if (res.ok) {
      setEntries((prev) => [
        {
          ...data.entry,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setNewEmail("");
      setNewReason("");
    } else {
      setError(data.error ?? "Failed to add entry.");
    }

    setAdding(false);
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    const res = await fetch("/api/do-not-contact", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
    setRemoving(null);
  }

  return (
    <div className="space-y-5">
      {/* Add new entry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-500" />
            Add to Do Not Contact List
          </CardTitle>
          <CardDescription>
            Emails on this list will never receive outreach from
            CodeLife Outreach.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="professor@university.edu"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Reason{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Input
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="e.g. Opted out, competitor"
                className="text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newEmail}
          >
            {adding ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Plus className="w-3 h-3 mr-1" />
            )}
            Add to List
          </Button>
        </CardContent>
      </Card>

      {/* Entries list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldOff className="w-4 h-4 text-red-400" />
            Do Not Contact List
            <Badge variant="outline" className="text-xs">
              {entries.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              No entries yet. Add emails above to block them from outreach.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {entry.email}
                    </p>
                    <p className="text-xs text-slate-400">
                      {entry.reason ?? "No reason provided"} ·{" "}
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleRemove(entry.id)}
                    disabled={removing === entry.id}
                  >
                    {removing === entry.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}