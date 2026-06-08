// src/app/login/[[...rest]]/page.tsx
// Catch-all login route for Clerk SignIn component.

import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            CodeLife Outreach
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            AI-assisted sales outreach
          </p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}