// src/lib/email-providers/microsoft.ts
// Microsoft OAuth + Outlook send implementation.
// Uses Microsoft Graph API to send emails.

import type { OAuthTokens, SendEmailParams, SendEmailResult } from "./index";

const GRAPH_ENDPOINT = "https://graph.microsoft.com/v1.0";

function getMicrosoftAuthEndpoint() {
  const tenant = process.env.MICROSOFT_TENANT_ID ?? "common";
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
}

export function getMicrosoftAuthUrl(dbUserId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    response_type: "code",
    redirect_uri:
      process.env.MICROSOFT_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email-accounts/callback`,
    scope: "offline_access Mail.Send User.Read",
    response_mode: "query",
    // State encodes both userId and provider
    state: JSON.stringify({ userId: dbUserId, provider: "microsoft" }),
  });

  return `${getMicrosoftAuthEndpoint()}/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftCode(
  code: string,
  dbUserId: string
): Promise<OAuthTokens> {
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ??
    `${process.env.NEXT_PUBLIC_APP_URL}/api/email-accounts/callback`;

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID ?? "",
    client_secret: process.env.MICROSOFT_CLIENT_SECRET ?? "",
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch(
    `${getMicrosoftAuthEndpoint()}/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Microsoft token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Get user profile from Microsoft Graph
  const profileRes = await fetch(`${GRAPH_ENDPOINT}/me`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  const profile = await profileRes.json();
  const email =
    profile.mail ?? profile.userPrincipalName ?? "";
  const displayName = profile.displayName ?? email;

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt,
    email,
    displayName,
  };
}

export async function sendOutlookEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  // Build Microsoft Graph send mail payload
  const message = {
    subject: params.subject,
    body: {
      contentType: "HTML",
      content: params.htmlBody,
    },
    toRecipients: [
      {
        emailAddress: { address: params.toEmail },
      },
    ],
  };

  try {
    const res = await fetch(`${GRAPH_ENDPOINT}/me/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[Outlook Send] Error:", err);
      return { messageId: null, success: false };
    }

    // Microsoft Graph returns 202 with no body on success
    return { messageId: null, success: true };
  } catch (error) {
    console.error("[Outlook Send] Network error:", error);
    return { messageId: null, success: false };
  }
}