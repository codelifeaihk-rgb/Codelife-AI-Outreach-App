// src/app/api/campaigns/[id]/finder/save/route.ts
// Saves a selected institution to the campaign's universities table.

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
    const { institution } = await req.json();
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

    // Save institution to universities table
    const saved = await prisma.university.create({
      data: {
        campaignId,
        name: institution.name,
        country: institution.country,
        websiteUrl: institution.websiteUrl ?? null,
        institutionKind: institution.institutionKind ?? "university",
        recommendationNote: institution.recommendationNote ?? null,
        biomedicalStrength: institution.biomedicalStrength ?? null,
        biotechActivity: institution.biotechActivity ?? null,
        aiHealthtechFocus: institution.aiHealthtechFocus ?? null,
        stemStrength: institution.stemStrength ?? null,
        innovationFocus: institution.innovationFocus ?? null,
        competitionReady: institution.competitionReady ?? null,
        ranking: institution.ranking ?? null,
      },
    });

    return NextResponse.json({ saved });
  } catch (error) {
    console.error("Save institution error:", error);
    return NextResponse.json(
      { error: "Failed to save institution." },
      { status: 500 }
    );
  }
}