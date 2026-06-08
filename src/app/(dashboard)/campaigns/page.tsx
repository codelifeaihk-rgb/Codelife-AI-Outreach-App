// src/app/(dashboard)/campaigns/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Megaphone,
  GraduationCap,
  School,
  Trash2,
  Loader2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  audienceMode: string;
  targetCountry: string;
  targetInstitution: string | null;
  status: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        setCampaigns(data.campaigns ?? []);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campaigns</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage your University and School outreach campaigns.
          </p>
        </div>
        <Link href="/campaigns/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && campaigns.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-10 h-10 text-slate-300 mb-4" />
            <h3 className="text-slate-700 font-medium mb-1">
              No campaigns yet
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Create your first campaign to start discovering contacts.
            </p>
            <Link href="/campaigns/new">
              <Button variant="outline" size="sm">
                Create Campaign
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Campaign list */}
      {!loading && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id}>
              {/* Delete confirmation */}
              {confirmDelete === campaign.id && (
                <div className="mb-2 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between gap-4">
                  <p className="text-sm text-red-700">
                    Delete <strong>{campaign.name}</strong>? This cannot be undone.
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(campaign.id)}
                      disabled={deleting === campaign.id}
                    >
                      {deleting === campaign.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Delete"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-4">
                  {/* Campaign info — clickable */}
                  <Link
                    href={`/campaigns/${campaign.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      {campaign.audienceMode === "university" ? (
                        <GraduationCap className="w-5 h-5 text-slate-600" />
                      ) : (
                        <School className="w-5 h-5 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {campaign.name}
                      </p>
                      <p className="text-sm text-slate-400 truncate">
                        {campaign.audienceMode === "university"
                          ? "University Mode"
                          : "School Mode"}
                        {" · "}
                        {campaign.targetCountry}
                        {campaign.targetInstitution
                          ? ` · ${campaign.targetInstitution}`
                          : ""}
                      </p>
                    </div>
                  </Link>

                  {/* Right side — status + delete */}
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        campaign.status === "active"
                          ? "bg-green-100 text-green-700"
                          : campaign.status === "draft"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {campaign.status}
                    </span>

                    {/* Delete button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5"
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmDelete(campaign.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}