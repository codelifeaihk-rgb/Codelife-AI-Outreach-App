// src/app/api/export/csv/route.ts
// GET — exports sent emails data as CSV.
// Query params: ?campaignId=xxx (optional — exports all if omitted)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await requireDbUser();
    const campaignId = req.nextUrl.searchParams.get("campaignId");
    const type = req.nextUrl.searchParams.get("type") ?? "sent";

    if (type === "contacts") {
      // Export contacts
      const contacts = await prisma.contact.findMany({
        where: {
          userId: dbUser.id,
          ...(campaignId ? { campaignId } : {}),
        },
        include: {
          campaign: { select: { name: true } },
          sources: { take: 1 },
        },
        orderBy: { createdAt: "desc" },
      });

      const headers = [
        "Full Name",
        "Email",
        "Role",
        "Department",
        "Institution",
        "Fit Score",
        "Decision Maker",
        "Lead Status",
        "Campaign",
        "Source URL",
        "Discovered At",
      ];

      const rows = contacts.map((c) => [
        c.fullName,
        c.email ?? "",
        c.role ?? "",
        c.department ?? "",
        c.institutionName ?? "",
        c.fitScore?.toString() ?? "",
        c.isDecisionMaker ? "Yes" : "No",
        c.leadStatus,
        c.campaign.name,
        c.sources[0]?.sourceUrl ?? "",
        c.createdAt.toISOString().split("T")[0],
      ]);

      return buildCsvResponse(headers, rows, "contacts");
    }

    // Export sent emails (default)
    const sentEmails = await prisma.sentEmail.findMany({
      where: {
        userId: dbUser.id,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        contact: {
          select: {
            fullName: true,
            role: true,
            institutionName: true,
            department: true,
          },
        },
        campaign: { select: { name: true } },
        emailAccount: { select: { email: true, provider: true } },
        events: {
          select: { eventType: true, occurredAt: true },
          orderBy: { occurredAt: "asc" },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    const headers = [
      "Campaign",
      "Recipient Email",
      "Contact Name",
      "Role",
      "Institution",
      "Department",
      "Subject",
      "Status",
      "Sent From",
      "Provider",
      "Sent At",
      "Opened",
      "Clicked",
      "Provider Message ID",
    ];

    const rows = sentEmails.map((s) => {
      const opened = s.events.some((e) => e.eventType === "opened");
      const clicked = s.events.some((e) => e.eventType === "clicked");

      return [
        s.campaign.name,
        s.recipientEmail,
        s.contact.fullName,
        s.contact.role ?? "",
        s.contact.institutionName ?? "",
        s.contact.department ?? "",
        s.subject,
        s.status,
        s.emailAccount?.email ?? "",
        s.emailAccount?.provider ?? "",
        s.sentAt?.toISOString().split("T")[0] ?? "",
        opened ? "Yes" : "No",
        clicked ? "Yes" : "No",
        s.providerMessageId ?? "",
      ];
    });

    return buildCsvResponse(headers, rows, "sent-emails");
  } catch (error) {
    console.error("[Export CSV] Error:", error);
    return NextResponse.json(
      { error: "Export failed." },
      { status: 500 }
    );
  }
}

function buildCsvResponse(
  headers: string[],
  rows: string[][],
  filename: string
): NextResponse {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvLines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];

  const csv = csvLines.join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${
        new Date().toISOString().split("T")[0]
      }.csv"`,
    },
  });
}