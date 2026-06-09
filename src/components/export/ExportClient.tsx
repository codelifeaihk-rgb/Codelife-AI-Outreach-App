"use client";

// src/components/export/ExportClient.tsx
// Export UI — lets users choose campaign and download CSV.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Download, Users, Mail, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
}

export default function ExportClient({
  campaigns,
}: {
  campaigns: Campaign[];
}) {
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  async function handleDownload(type: "contacts" | "sent") {
    setDownloading(type);
    try {
      const params = new URLSearchParams({ type });
      if (selectedCampaign) params.set("campaignId", selectedCampaign);

      const res = await fetch(`/api/export/csv?${params.toString()}`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "contacts"
          ? `contacts-${new Date().toISOString().split("T")[0]}.csv`
          : `sent-emails-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download error:", e);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Campaign filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter by Campaign</CardTitle>
          <CardDescription>
            Leave blank to export all data across campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <option value="">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Export options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Download CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contacts export */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Contacts Export
                </p>
                <p className="text-xs text-slate-400">
                  Name, email, role, institution, fit score, lead status
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload("contacts")}
              disabled={downloading !== null}
            >
              {downloading === "contacts" ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Download className="w-3 h-3 mr-1" />
              )}
              Download
            </Button>
          </div>

          {/* Sent emails export */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  Sent Emails Export
                </p>
                <p className="text-xs text-slate-400">
                  Recipient, subject, status, open/click data, timestamps
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload("sent")}
              disabled={downloading !== null}
            >
              {downloading === "sent" ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Download className="w-3 h-3 mr-1" />
              )}
              Download
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CRM instructions */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="py-4">
          <p className="text-sm font-medium text-blue-800 mb-1">
            Importing to a CRM
          </p>
          <p className="text-xs text-blue-600">
            The CSV format is compatible with HubSpot, Salesforce, and
            most CRM tools. Use the contacts export for leads and sent
            emails export for activity history.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}