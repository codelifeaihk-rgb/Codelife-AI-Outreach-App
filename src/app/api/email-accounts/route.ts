// src/app/api/email-accounts/route.ts
// GET — list connected email accounts for the current user.

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbUser = await requireDbUser();

    const accounts = await prisma.emailAccount.findMany({
      where: { userId: dbUser.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        status: true,
        isDefault: true,
        accessTokenExpiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[Email Accounts GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts." },
      { status: 500 }
    );
  }
}