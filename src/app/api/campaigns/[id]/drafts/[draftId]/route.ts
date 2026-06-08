// src/app/api/campaigns/[id]/drafts/[draftId]/route.ts
// PATCH — approve, reject, or update a draft
// DELETE — delete a draft

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, draftId } = await params;
    const dbUser = await requireDbUser();
    const body = await req.json();

    // Verify ownership
    const draft = await prisma.emailDraft.findFirst({
      where: {
        id: draftId,
        campaignId,
        campaign: { userId: dbUser.id },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Draft not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.action === "approve") {
      updateData.status = "approved";
      updateData.approvedAt = new Date();
    } else if (body.action === "reject") {
      updateData.status = "rejected";
    } else if (body.action === "update") {
      if (body.subject) updateData.subject = body.subject;
      if (body.bodyHtml) updateData.bodyHtml = body.bodyHtml;
    }

    const updated = await prisma.emailDraft.update({
      where: { id: draftId },
      data: updateData,
    });

    return NextResponse.json({ draft: updated });
  } catch (error) {
    console.error("[Draft PATCH] Error:", error);
    return NextResponse.json(
      { error: "Failed to update draft." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; draftId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: campaignId, draftId } = await params;
    const dbUser = await requireDbUser();

    await prisma.emailDraft.deleteMany({
      where: {
        id: draftId,
        campaignId,
        campaign: { userId: dbUser.id },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Draft DELETE] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete draft." },
      { status: 500 }
    );
  }
}