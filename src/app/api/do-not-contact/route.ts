// src/app/api/do-not-contact/route.ts
// GET — list all DNC entries
// POST — add email to DNC list
// DELETE — remove email from DNC list

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

    const entries = await prisma.doNotContact.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("[DNC GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch list." },
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
    const { email, reason } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address required." },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await prisma.doNotContact.findFirst({
      where: { userId: dbUser.id, email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already on the Do Not Contact list." },
        { status: 409 }
      );
    }

    const entry = await prisma.doNotContact.create({
      data: {
        userId: dbUser.id,
        email,
        reason: reason ?? "Manually added",
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("[DNC POST]", error);
    return NextResponse.json(
      { error: "Failed to add entry." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dbUser = await requireDbUser();
    const { id } = await req.json();

    await prisma.doNotContact.deleteMany({
      where: { id, userId: dbUser.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DNC DELETE]", error);
    return NextResponse.json(
      { error: "Failed to remove entry." },
      { status: 500 }
    );
  }
}