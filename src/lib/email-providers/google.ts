// src/lib/email-providers/google.ts
// Google OAuth + Gmail send implementation.
// Scope: gmail.send only — we cannot read user inbox.

import { google } from "googleapis";
import type { OAuthTokens, SendEmailParams, SendEmailResult } from "./index";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI ??
      `${process.env.NEXT_PUBLIC_APP_URL}/api/email-accounts/callback`
  );
}

export function getGoogleAuthUrl(dbUserId: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    // State encodes both userId and provider so callback knows both
    state: JSON.stringify({ userId: dbUserId, provider: "google" }),
  });
}

export async function exchangeGoogleCode(
  code: string,
  dbUserId: string
): Promise<OAuthTokens> {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get user email
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();

  return {
    accessToken: tokens.access_token ?? "",
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
    email: data.email ?? "",
    displayName: data.name ?? data.email ?? "",
  };
}

export async function sendGmailEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const client = getOAuth2Client();
  client.setCredentials({
    access_token: params.accessToken,
    refresh_token: params.refreshToken ?? undefined,
  });

  const gmail = google.gmail({ version: "v1", auth: client });

  // Build RFC 2822 message
  const boundary = "codelife_boundary_" + Date.now();
  const messageParts = [
    `To: ${params.toEmail}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    ``,
    params.textBody ?? params.htmlBody.replace(/<[^>]*>/g, ""),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    params.htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\n");

  const encoded = Buffer.from(messageParts)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    const res = await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });
    return { messageId: res.data.id ?? null, success: true };
  } catch (error) {
    console.error("[Gmail Send] Error:", error);
    return { messageId: null, success: false };
  }
}