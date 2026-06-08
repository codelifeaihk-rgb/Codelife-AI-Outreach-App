// src/app/api/email-accounts/callback/route.ts
// GET /api/email-accounts/callback?code=...&state=...
// Handles OAuth callback for both Google and Microsoft.
// Exchanges code for tokens and saves to email_accounts table.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";
import { exchangeCodeForTokens } from "@/src/lib/email-providers/index";
import type { EmailProvider } from "@/src/lib/email-providers/index";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl = `${appUrl}/settings/email-accounts?connected=true`;
  const failUrl = `${appUrl}/settings/email-accounts?error=oauth_failed`;

  // Handle user denied OAuth
  if (error) {
    console.error("[Email Callback] OAuth error:", error);
    return NextResponse.redirect(failUrl);
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings/email-accounts?error=missing_params`
    );
  }

  // Parse state — contains { userId, provider }
  let dbUserId: string;
  let provider: EmailProvider;

  try {
    const parsed = JSON.parse(state);
    dbUserId = parsed.userId;
    provider = parsed.provider as EmailProvider;
  } catch {
    console.error("[Email Callback] Invalid state:", state);
    return NextResponse.redirect(failUrl);
  }

  if (!dbUserId || !provider) {
    return NextResponse.redirect(failUrl);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      provider,
      code,
      dbUserId
    );

    console.log(
      `[Email Callback] Got tokens for ${tokens.email} via ${provider}`
    );

    // Upsert email account in DB
    await prisma.emailAccount.upsert({
      where: {
        userId_email: {
          userId: dbUserId,
          email: tokens.email,
        },
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.expiresAt,
        status: "connected",
        provider,
        displayName: tokens.displayName,
      },
      create: {
        userId: dbUserId,
        provider,
        providerAccountId: tokens.email,
        email: tokens.email,
        displayName: tokens.displayName,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessTokenExpiresAt: tokens.expiresAt,
        scope:
          provider === "google"
            ? "gmail.send"
            : "Mail.Send",
        tokenType: "Bearer",
        isDefault: true,
        status: "connected",
      },
    });

    console.log(
      `[Email Callback] Saved ${provider} account: ${tokens.email}`
    );

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("[Email Callback] Token exchange failed:", error);
    return NextResponse.redirect(failUrl);
  }
}