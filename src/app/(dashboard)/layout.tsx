// Dashboard layout — Sidebar + TopNav; requires Clerk sign-in (redirects to /login).
import OnboardingWrapper from "@/src/components/onboarding/OnboardingWrapper";
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

  // Redirect to login if not authenticated
  if (!userId) {
    redirect("/login");
  }

  return (
    <>
      {/* Onboarding modal for first-time users */}
      <OnboardingWrapper />

      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <TopNav />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
