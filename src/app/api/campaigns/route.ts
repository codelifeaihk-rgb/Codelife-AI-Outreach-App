// src/app/api/campaigns/route.ts
// GET — list campaigns, POST — create campaign

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await requireDbUser();
    const campaigns = await prisma.campaign.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Get campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await requireDbUser();
    const body = await req.json();

    const campaign = await prisma.campaign.create({
      data: {
        userId: dbUser.id,
        name: body.name,
        audienceMode: body.audienceMode,
        targetCountry: body.targetCountry,
        targetInstitution: body.targetInstitution || null,
        targetDepartment: body.targetDepartment || null,
        targetLanguage: body.targetLanguage || null,
        status: "draft",
        complianceMode: true,
      },
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json(
      { error: "Failed to create campaign." },
      { status: 500 }
    );
  }
}