// src/lib/email-providers/send.ts
// Unified email sending for Google (Gmail API) and Microsoft (Graph API).
// Handles token refresh automatically for both providers.
// Called by the send API route after approval verification.

import { prisma } from "@/src/lib/db";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendParams {
  emailAccountId: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  provider: string;
}

// ─── Token refresh helpers ────────────────────────────────────────────────────

async function refreshGoogleToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

async function refreshMicrosoftToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresAt: Date }> {
  const tenantId = process.env.MICROSOFT_TENANT_ID ?? "common";
  const res = await fetch(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "Mail.Send User.Read offline_access",
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Microsoft token refresh failed: ${err}`);
  }

  const data = await res.json();
  return {
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

// ─── Get valid access token (refresh if expired) ──────────────────────────────

async function getValidToken(emailAccountId: string): Promise<{
  accessToken: string;
  provider: string;
  email: string;
}> {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account) {
    throw new Error("Email account not found.");
  }

  if (!account.accessToken) {
    throw new Error(
      "Email account has no access token. Please reconnect your account."
    );
  }

  // Check if token is expired (with 5-minute buffer)
  const isExpired =
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000);

  if (isExpired && account.refreshToken) {
    console.log(`[Email] Token expired for ${account.email}, refreshing...`);

    let refreshed: { accessToken: string; expiresAt: Date };

    if (account.provider === "google") {
      refreshed = await refreshGoogleToken(account.refreshToken);
    } else if (account.provider === "microsoft") {
      refreshed = await refreshMicrosoftToken(account.refreshToken);
    } else {
      throw new Error(`Unknown provider: ${account.provider}`);
    }

    // Save new token to DB
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        accessToken: refreshed.accessToken,
        accessTokenExpiresAt: refreshed.expiresAt,
      },
    });

    console.log(`[Email] Token refreshed for ${account.email}`);

    return {
      accessToken: refreshed.accessToken,
      provider: account.provider,
      email: account.email,
    };
  }

  return {
    accessToken: account.accessToken,
    provider: account.provider,
    email: account.email,
  };
}

// ─── Google Gmail send ────────────────────────────────────────────────────────

async function sendViaGoogle(params: {
  accessToken: string;
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<string> {
  const boundary = `codelife_${Date.now()}`;

  // Build RFC 2822 MIME message
  const messageParts = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    params.textBody ??
      params.htmlBody
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    params.htmlBody,
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  // Base64url encode
  const encoded = Buffer.from(messageParts)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encoded }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    console.error("[Gmail Send] Error:", err);
    throw new Error(
      `Gmail send failed: ${err.error?.message ?? JSON.stringify(err)}`
    );
  }

  const data = await res.json();
  console.log(`[Gmail] Sent successfully. MessageId: ${data.id}`);
  return data.id ?? `gmail_${Date.now()}`;
}

// ─── Microsoft Outlook send ───────────────────────────────────────────────────

async function sendViaMicrosoft(params: {
  accessToken: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}): Promise<string> {
  // Microsoft Graph API sendMail endpoint
  const body = {
    message: {
      subject: params.subject,
      body: {
        contentType: "HTML",
        content: params.htmlBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: params.to,
          },
        },
      ],
    },
    saveToSentItems: true,
  };

  const res = await fetch(
    "https://graph.microsoft.com/v1.0/me/sendMail",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  // Microsoft Graph returns 202 Accepted with empty body on success
  if (res.status !== 202 && !res.ok) {
    const errText = await res.text();
    console.error("[Microsoft Send] Error:", errText);
    throw new Error(`Microsoft send failed (${res.status}): ${errText}`);
  }

  const messageId = `ms_${Date.now()}`;
  console.log(`[Microsoft] Sent successfully. MessageId: ${messageId}`);
  return messageId;
}

// ─── Main send function ───────────────────────────────────────────────────────

export async function sendEmail(params: SendParams): Promise<SendResult> {
  // Get valid token (auto-refresh if expired)
  const { accessToken, provider, email } = await getValidToken(
    params.emailAccountId
  );

  console.log(
    `[Email] Sending via ${provider} from ${email} to ${params.to}`
  );

  let messageId: string;

  if (provider === "google") {
    messageId = await sendViaGoogle({
      accessToken,
      from: email,
      to: params.to,
      subject: params.subject,
      htmlBody: params.htmlBody,
      textBody: params.textBody,
    });
  } else if (provider === "microsoft") {
    messageId = await sendViaMicrosoft({
      accessToken,
      to: params.to,
      subject: params.subject,
      htmlBody: params.htmlBody,
      textBody: params.textBody,
    });
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    success: true,
    messageId,
    provider,
  };
}