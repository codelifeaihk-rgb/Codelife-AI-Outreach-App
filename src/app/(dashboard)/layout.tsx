// src/app/(dashboard)/layout.tsx
// Dashboard shell — sidebar + topnav + main content area.
// Supports light and dark mode via CSS variables.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Sidebar from "@/src/components/layout/Sidebar";
import TopNav from "@/src/components/layout/TopNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-[hsl(var(--sidebar-bg))] flex flex-col hidden md:flex">
        <Sidebar />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top nav */}
        <header className="h-14 border-b border-border bg-background flex items-center px-6 shrink-0">
          <TopNav />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="p-6 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}