// src/components/dashboard/RecentActivity.tsx
// Shows recent email events — opens, clicks, sends.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MousePointer, Eye, Send } from "lucide-react";

interface ActivityItem {
  id: string;
  eventType: string;
  recipientEmail: string;
  subject: string;
  occurredAt: Date;
}

interface RecentActivityProps {
  items: ActivityItem[];
}

const eventConfig: Record<string,{ label: string; color: string; Icon: typeof Mail }> = {
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", Icon: Send },
  opened: { label: "Opened", color: "bg-green-100 text-green-700", Icon: Eye },
  clicked: { label: "Clicked", color: "bg-purple-100 text-purple-700", Icon: MousePointer },
};

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No activity yet. Send your first email to see results here.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const config =
                eventConfig[item.eventType] ?? eventConfig.sent;
              const { Icon } = config;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <div className={`w-7 h-7 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {item.recipientEmail}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.subject}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${config.color} border-0`}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {new Date(item.occurredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}