// src/components/campaigns/CampaignProgress.tsx
// Visual progress tracker for campaign workflow.
// Shows how far along the salesperson is in the outreach process.

interface CampaignProgressProps {
    universitiesCount: number;
    contactsCount: number;
    draftsCount: number;
    sentCount: number;
  }
  
  const STEPS = [
    { id: 1, label: "Campaign Created", key: "created" },
    { id: 2, label: "Institutions Found", key: "institutions" },
    { id: 3, label: "Contacts Discovered", key: "contacts" },
    { id: 4, label: "Drafts Generated", key: "drafts" },
    { id: 5, label: "Emails Sent", key: "sent" },
  ];
  
  export default function CampaignProgress({
    universitiesCount,
    contactsCount,
    draftsCount,
    sentCount,
  }: CampaignProgressProps) {
    function getStepStatus(key: string): "done" | "current" | "pending" {
      if (key === "created") return "done";
      if (key === "institutions") {
        return universitiesCount > 0 ? "done" : "current";
      }
      if (key === "contacts") {
        if (universitiesCount === 0) return "pending";
        return contactsCount > 0 ? "done" : "current";
      }
      if (key === "drafts") {
        if (contactsCount === 0) return "pending";
        return draftsCount > 0 ? "done" : "current";
      }
      if (key === "sent") {
        if (draftsCount === 0) return "pending";
        return sentCount > 0 ? "done" : "current";
      }
      return "pending";
    }
  
    function getStepCount(key: string): number | null {
      if (key === "institutions") return universitiesCount || null;
      if (key === "contacts") return contactsCount || null;
      if (key === "drafts") return draftsCount || null;
      if (key === "sent") return sentCount || null;
      return null;
    }
  
    const completedCount = STEPS.filter(
      (s) => getStepStatus(s.key) === "done"
    ).length;
  
    const progressPercent = Math.round((completedCount / STEPS.length) * 100);
  
    return (
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium">Campaign Progress</span>
          <span>{progressPercent}% complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
  
        {/* Steps */}
        <div className="space-y-2 pt-1">
          {STEPS.map((step) => {
            const status = getStepStatus(step.key);
            const count = getStepCount(step.key);
  
            return (
              <div key={step.id} className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    status === "done"
                      ? "bg-green-500 text-white"
                      : status === "current"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {status === "done" ? "✓" : step.id}
                </div>
  
                {/* Label */}
                <span
                  className={`text-sm ${
                    status === "done"
                      ? "text-green-700 font-medium"
                      : status === "current"
                      ? "text-blue-700 font-medium"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                  {count !== null && count > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-slate-400">
                      ({count})
                    </span>
                  )}
                </span>
  
                {/* Current indicator */}
                {status === "current" && (
                  <span className="text-xs text-blue-400 ml-auto">
                    ← you are here
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }