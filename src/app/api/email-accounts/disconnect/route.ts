// src/app/api/email-accounts/disconnect/route.ts
// POST — disconnect and delete a connected email account.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";
import { requireDbUser } from "@/src/lib/clerk-user";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await req.json();
    const dbUser = await requireDbUser();

    await prisma.emailAccount.deleteMany({
      where: {
        id: accountId,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[EmailAccounts Disconnect] Error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect account." },
      { status: 500 }
    );
  }
}