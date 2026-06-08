// src/app/api/campaigns/[id]/send/route.ts
// POST — sends an approved email draft using the connected email account.
//
// Flow:
// 1. Verify draft is approved (hard requirement — no send without approval)
// 2. Check DoNotContact list
// 3. Get connected email account
// 4. Send via Google or Microsoft (auto-refresh token if expired)
// 5. Log to sent_emails + email_events tables
// 6. Update draft status to "sent"

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";
import { sendEmail } from "@/src/lib/email-providers/send";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId } = await params;
    const { draftId, emailAccountId } = await req.json();

    if (!draftId || !emailAccountId) {
      return NextResponse.json(
        { error: "draftId and emailAccountId are required." },
        { status: 400 }
      );
    }

    const dbUser = await requireDbUser();

    // ── Step 1: Verify campaign ownership ─────────────────────────────────
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: dbUser.id },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 }
      );
    }

    // ── Step 2: Get draft and verify it is approved ────────────────────────
    const draft = await prisma.emailDraft.findFirst({
      where: { id: draftId, campaignId },
      include: {
        contact: true,
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found." },
        { status: 404 }
      );
    }

    // CRITICAL: Enforce human approval — PRD compliance
    if (draft.status !== "approved") {
      return NextResponse.json(
        {
          error:
            "This draft has not been approved. Please approve it before sending.",
        },
        { status: 403 }
      );
    }

    // ── Step 3: Validate recipient email ───────────────────────────────────
    if (!draft.contact.email) {
      return NextResponse.json(
        {
          error:
            "This contact has no email address. Cannot send.",
        },
        { status: 400 }
      );
    }

    // ── Step 4: Check DoNotContact list ────────────────────────────────────
    const blocked = await prisma.doNotContact.findFirst({
      where: {
        userId: dbUser.id,
        email: draft.contact.email,
      },
    });

    if (blocked) {
      return NextResponse.json(
        {
          error: `${draft.contact.email} is on the Do Not Contact list.`,
        },
        { status: 403 }
      );
    }

    // ── Step 5: Get and verify email account ───────────────────────────────
    const emailAccount = await prisma.emailAccount.findFirst({
      where: {
        id: emailAccountId,
        userId: dbUser.id,
      },
    });

    if (!emailAccount) {
      return NextResponse.json(
        {
          error:
            "Email account not found. Please connect your email account in Settings.",
        },
        { status: 404 }
      );
    }

    if (emailAccount.status !== "connected") {
      return NextResponse.json(
        {
          error: `Email account status is "${emailAccount.status}". Please reconnect in Settings → Email Accounts.`,
        },
        { status: 400 }
      );
    }

    // ── Step 6: Send the email ─────────────────────────────────────────────
    console.log(
      `[Send] Sending draft ${draftId} to ${draft.contact.email} via ${emailAccount.provider}`
    );

    let sendResult: Awaited<ReturnType<typeof sendEmail>>;

    try {
      sendResult = await sendEmail({
        emailAccountId: emailAccount.id,
        to: draft.contact.email,
        subject: draft.subject,
        htmlBody: draft.bodyHtml,
        textBody: draft.bodyText ?? undefined,
      });
    } catch (sendError) {
      const errMessage =
        sendError instanceof Error
          ? sendError.message
          : "Unknown send error";

      console.error("[Send] Send failed:", errMessage);

      // Log failed attempt to sent_emails
      await prisma.sentEmail.create({
        data: {
          userId: dbUser.id,
          campaignId,
          contactId: draft.contactId,
          emailAccountId: emailAccount.id,
          draftId: draft.id,
          recipientEmail: draft.contact.email,
          subject: draft.subject,
          bodyHtml: draft.bodyHtml,
          status: "failed",
          audit: {
            error: errMessage,
            attemptedAt: new Date().toISOString(),
            provider: emailAccount.provider,
          },
        },
      });

      return NextResponse.json(
        {
          error: `Failed to send email: ${errMessage}`,
        },
        { status: 500 }
      );
    }

    // ── Step 7: Log successful send to sent_emails ─────────────────────────
    const sentEmail = await prisma.sentEmail.create({
      data: {
        userId: dbUser.id,
        campaignId,
        contactId: draft.contactId,
        emailAccountId: emailAccount.id,
        draftId: draft.id,
        recipientEmail: draft.contact.email,
        subject: draft.subject,
        bodyHtml: draft.bodyHtml,
        providerMessageId: sendResult.messageId,
        status: "sent",
        sentAt: new Date(),
        audit: {
          approvedAt: draft.approvedAt?.toISOString(),
          sentBy: dbUser.email,
          emailAccount: emailAccount.email,
          provider: sendResult.provider,
          draftVersion: draft.version,
          messageId: sendResult.messageId,
        },
      },
    });

    // ── Step 8: Update draft status to "sent" ──────────────────────────────
    await prisma.emailDraft.update({
      where: { id: draft.id },
      data: { status: "sent" },
    });

    // ── Step 9: Log email event ────────────────────────────────────────────
    await prisma.emailEvent.create({
      data: {
        sentEmailId: sentEmail.id,
        eventType: "sent",
        metadata: {
          messageId: sendResult.messageId,
          provider: sendResult.provider,
          from: emailAccount.email,
          to: draft.contact.email,
        },
        occurredAt: new Date(),
      },
    });

    // ── Step 10: Update contact lead status ───────────────────────────────
    await prisma.contact.update({
      where: { id: draft.contactId },
      data: { leadStatus: "contacted" },
    });

    console.log(
      `[Send] Success — sentEmailId: ${sentEmail.id} | messageId: ${sendResult.messageId}`
    );

    return NextResponse.json({
      success: true,
      sentEmailId: sentEmail.id,
      messageId: sendResult.messageId,
      provider: sendResult.provider,
    });
  } catch (error) {
    console.error("[Send Route] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}