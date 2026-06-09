// src/app/api/track/open/route.ts
// GET — open pixel tracker.
// Embedded as a 1x1 transparent image in every sent email.
// When email client loads the image, this endpoint fires and logs the open.
// Usage in email HTML:
// <img src="https://yourdomain.com/api/track/open?id=SENT_EMAIL_ID" width="1" height="1" />

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/db";

// 1x1 transparent GIF in base64
const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const sentEmailId = req.nextUrl.searchParams.get("id");

  if (sentEmailId) {
    try {
      // Check if already opened to avoid duplicate events
      const alreadyOpened = await prisma.emailEvent.findFirst({
        where: { sentEmailId, eventType: "opened" },
      });

      if (!alreadyOpened) {
        // Log open event
        await prisma.emailEvent.create({
          data: {
            sentEmailId,
            eventType: "opened",
            occurredAt: new Date(),
            metadata: {
              userAgent: req.headers.get("user-agent") ?? "",
              ip: req.headers.get("x-forwarded-for") ?? "",
            },
          },
        });

        // Update sent email status
        await prisma.sentEmail.update({
          where: { id: sentEmailId },
          data: { status: "opened" },
        });

        console.log(`[Track Open] sentEmailId: ${sentEmailId}`);
      }
    } catch (e) {
      // Never fail tracking — silently ignore errors
      console.error("[Track Open] Error:", e);
    }
  }

  // Always return the pixel
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}