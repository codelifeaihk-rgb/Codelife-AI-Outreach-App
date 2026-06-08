// src/app/api/email-accounts/connect/route.ts
// GET /api/email-accounts/connect?provider=google
// GET /api/email-accounts/connect?provider=microsoft
// Redirects user to the OAuth consent screen for the chosen provider.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireDbUser } from "@/src/lib/clerk-user";
import { getAuthUrl } from "@/src/lib/email-providers/index";
import type { EmailProvider } from "@/src/lib/email-providers/index";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    const provider = req.nextUrl.searchParams.get(
      "provider"
    ) as EmailProvider | null;

    if (!provider || !["google", "microsoft"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Use ?provider=google or ?provider=microsoft" },
        { status: 400 }
      );
    }

    const dbUser = await requireDbUser();
    const authUrl = await getAuthUrl(provider, dbUser.id);

    console.log(
      `[Email Connect] Redirecting to ${provider} OAuth for user ${dbUser.id}`
    );

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Email Connect] Error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings/email-accounts?error=connect_failed",
        req.url
      )
    );
  }
}