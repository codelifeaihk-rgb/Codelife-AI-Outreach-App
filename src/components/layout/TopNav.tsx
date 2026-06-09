// src/components/layout/TopNav.tsx
// Top navigation bar with user info and theme toggle.

"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";

export default function TopNav() {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left — user greeting */}
      <p className="text-sm text-muted-foreground">
        {user?.firstName
          ? `Welcome back, ${user.firstName}`
          : "CodeLife Outreach"}
      </p>

      {/* Right — theme toggle + user button */}
      <div className="flex items-center gap-4">
        {/* Theme toggle — also shown in topnav for mobile */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8",
            },
          }}
        />
      </div>
    </div>
  );
}
