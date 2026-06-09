"use client";
// Main navigation sidebar for CodeLife Outreach dashboard.
// Includes main nav + settings section with active link highlighting.

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
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/sent-emails", label: "Sent Emails", icon: Mail },
  { href: "/export", label: "Export", icon: Download },
];

const settingsLinks = [
  { href: "/settings/email-accounts", label: "Email Accounts", icon: Mail },
  { href: "/settings/do-not-contact", label: "Do Not Contact", icon: ShieldOff },
  { href: "/settings", label: "AI Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-slate-900 text-slate-100 px-4 py-6">
      {/* Logo / Brand */}
      <div className="mb-8 px-2">
        <h1 className="text-lg font-bold text-white">CodeLife Outreach</h1>
        <p className="text-xs text-slate-400 mt-0.5">AI-assisted outreach</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-slate-700 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
          Settings
        </p>
        <div className="space-y-1">
          {settingsLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-slate-700 text-white font-medium"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}