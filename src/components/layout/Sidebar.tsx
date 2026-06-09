// src/components/layout/Sidebar.tsx
// App sidebar — navigation links with dark mode support.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Mail,
  Download,
  Settings,
  ShieldOff,
  GraduationCap,
} from "lucide-react";
import { ThemeToggle } from "@/src/components/theme/ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/sent-emails", label: "Sent Emails", icon: Mail },
  { href: "/export", label: "Export", icon: Download },
];

const settingsLinks = [
  {
    href: "/settings/email-accounts",
    label: "Email Accounts",
    icon: Mail,
  },
  {
    href: "/settings/do-not-contact",
    label: "Do Not Contact",
    icon: ShieldOff,
  },
  { href: "/settings", label: "AI Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex flex-col h-full py-4">
      {/* Logo */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none">
              CodeLife
            </p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">
              Outreach
            </p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive(link.href)
                ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-text-active))]"
                : "text-[hsl(var(--sidebar-text))] hover:text-[hsl(var(--sidebar-text-active))] hover:bg-[hsl(var(--sidebar-hover))]"
            }`}
          >
            <link.icon className="w-4 h-4 shrink-0" />
            {link.label}
          </Link>
        ))}

        {/* Settings section */}
        <div className="pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-2">
            Settings
          </p>
          {settingsLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-text-active))]"
                  : "text-[hsl(var(--sidebar-text))] hover:text-[hsl(var(--sidebar-text-active))] hover:bg-[hsl(var(--sidebar-hover))]"
              }`}
            >
              <link.icon className="w-4 h-4 shrink-0" />
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Theme toggle at bottom of sidebar */}
      <div className="px-4 pt-4 border-t border-border">
        <ThemeToggle />
      </div>
    </div>
  );
}