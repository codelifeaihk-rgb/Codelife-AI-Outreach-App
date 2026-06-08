"use client";

// src/components/campaigns/DeleteCampaignButton.tsx
// Client component — delete campaign button with confirmation.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

export default function DeleteCampaignButton({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/campaigns");
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Sure?</span>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Delete"
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirm(false)}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-400 hover:text-red-600 hover:bg-red-50"
      onClick={() => setConfirm(true)}
    >
      <Trash2 className="w-4 h-4 mr-1" />
      Delete
    </Button>
  );
}