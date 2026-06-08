// src/app/api/campaigns/[id]/contacts/save/route.ts
// Saves a discovered contact — prevents duplicates using upsert logic.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

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
    const { contact } = await req.json();
    const dbUser = await requireDbUser();

    // Verify campaign belongs to user
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: dbUser.id },
    });
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Check DoNotContact list
    if (contact.email) {
      const blocked = await prisma.doNotContact.findFirst({
        where: { userId: dbUser.id, email: contact.email },
      });
      if (blocked) {
        return NextResponse.json(
          { error: "This contact is on the Do Not Contact list." },
          { status: 403 }
        );
      }
    }

    // Check for existing contact to prevent duplicates
    // Match by email if available, otherwise by fullName + institutionName
    const existingContact = contact.email
      ? await prisma.contact.findFirst({
          where: {
            campaignId,
            email: contact.email,
          },
        })
      : await prisma.contact.findFirst({
          where: {
            campaignId,
            fullName: contact.fullName,
            institutionName: contact.institutionName ?? null,
          },
        });

    if (existingContact) {
      console.log(`[Contacts Save] Duplicate detected: ${contact.fullName}`);
      return NextResponse.json(
        {
          saved: existingContact,
          duplicate: true,
          message: "Contact already exists in this campaign.",
        },
        { status: 200 }
      );
    }

    // Save new contact
    const saved = await prisma.contact.create({
      data: {
        userId: dbUser.id,
        campaignId,
        fullName: contact.fullName,
        email: contact.email ?? null,
        role: contact.role ?? null,
        department: contact.department ?? null,
        institutionName: contact.institutionName ?? null,
        fitScore: contact.fitScore ?? null,
        fitExplanation: contact.fitExplanation ?? null,
        isDecisionMaker: contact.isDecisionMaker ?? false,
        leadStatus: "discovered",
        sources: {
          create: contact.sourceUrl
            ? [
                {
                  sourceUrl: contact.sourceUrl,
                  sourceType: contact.sourceType ?? "Web",
                  title: contact.institutionName ?? "",
                },
              ]
            : [],
        },
      },
    });

    console.log(`[Contacts Save] Saved: ${contact.fullName}`);
    return NextResponse.json({ saved, duplicate: false });
  } catch (error) {
    console.error("[Contacts Save] Error:", error);
    return NextResponse.json(
      { error: "Failed to save contact." },
      { status: 500 }
    );
  }
}