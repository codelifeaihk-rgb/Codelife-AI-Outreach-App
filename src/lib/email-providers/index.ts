// src/lib/email-providers/index.ts
// Unified email provider interface.
// All providers implement the same shape so sending logic is provider-agnostic.

export type EmailProvider = "google" | "microsoft";

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  email: string;
  displayName: string;
}

export interface SendEmailParams {
  accessToken: string;
  refreshToken: string | null;
  fromEmail: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface SendEmailResult {
  messageId: string | null;
  success: boolean;
}

// Get the OAuth authorization URL for the given provider
export async function getAuthUrl(
  provider: EmailProvider,
  dbUserId: string
): Promise<string> {
  if (provider === "google") {
    const { getGoogleAuthUrl } = await import("./google");
    return getGoogleAuthUrl(dbUserId);
  }
  if (provider === "microsoft") {
    const { getMicrosoftAuthUrl } = await import("./microsoft");
    return getMicrosoftAuthUrl(dbUserId);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  provider: EmailProvider,
  code: string,
  dbUserId: string
): Promise<OAuthTokens> {
  if (provider === "google") {
    const { exchangeGoogleCode } = await import("./google");
    return exchangeGoogleCode(code, dbUserId);
  }
  if (provider === "microsoft") {
    const { exchangeMicrosoftCode } = await import("./microsoft");
    return exchangeMicrosoftCode(code, dbUserId);
  }
  throw new Error(`Unknown provider: ${provider}`);
}

// Send email via the provider
export async function sendProviderEmail(
  provider: EmailProvider,
  params: SendEmailParams
): Promise<SendEmailResult> {
  if (provider === "google") {
    const { sendGmailEmail } = await import("./google");
    return sendGmailEmail(params);
  }
  if (provider === "microsoft") {
    const { sendOutlookEmail } = await import("./microsoft");
    return sendOutlookEmail(params);
  }
  throw new Error(`Unknown provider: ${provider}`);
}