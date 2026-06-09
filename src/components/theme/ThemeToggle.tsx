// src/components/theme/ThemeToggle.tsx
// Toggle button for switching between light and dark mode.
// Uses shadcn Switch + next-themes.

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2.5">
      <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) =>
          setTheme(checked ? "dark" : "light")
        }
        aria-label="Toggle dark mode"
      />
      <Moon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <Label className="text-xs text-slate-500 cursor-pointer select-none">
        {isDark ? "Dark" : "Light"}
      </Label>
    </div>
  );
}