// src/components/dashboard/StatsCard.tsx
// Reusable stats card for dashboard metrics.

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "green" | "purple" | "amber" | "red";
  sub?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    value: "text-blue-700",
  },
  green: {
    bg: "bg-green-50",
    icon: "text-green-500",
    value: "text-green-700",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-500",
    value: "text-purple-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    value: "text-amber-700",
  },
  red: {
    bg: "bg-red-50",
    icon: "text-red-500",
    value: "text-red-700",
  },
};

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: StatsCardProps) {
  const c = colorMap[color];

  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${c.value}`}>
              {value}
            </p>
            {sub && (
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}