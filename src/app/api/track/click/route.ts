// src/app/api/track/click/route.ts
// GET — link click tracker.
// Replace links in sent emails with tracked versions.
// Usage: /api/track/click?id=SENT_EMAIL_ID&url=ENCODED_URL
// User is redirected to the original URL after tracking.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

export async function GET(req: NextRequest) {
  const sentEmailId = req.nextUrl.searchParams.get("id");
  const targetUrl = req.nextUrl.searchParams.get("url");

  if (sentEmailId && targetUrl) {
    try {
      // Log click event
      await prisma.emailEvent.create({
        data: {
          sentEmailId,
          eventType: "clicked",
          occurredAt: new Date(),
          metadata: {
            url: targetUrl,
            userAgent: req.headers.get("user-agent") ?? "",
          },
        },
      });

      // Update sent email status to clicked
      await prisma.sentEmail.update({
        where: { id: sentEmailId },
        data: { status: "clicked" },
      });

      console.log(`[Track Click] sentEmailId: ${sentEmailId} url: ${targetUrl}`);
    } catch (e) {
      console.error("[Track Click] Error:", e);
    }
  }

  // Redirect to original URL
  const destination = targetUrl ?? "https://codelife.ai";
  return NextResponse.redirect(destination);
}