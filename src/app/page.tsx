// Root route — redirects to /dashboard when signed in, otherwise /login.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }
  redirect("/login");
}
