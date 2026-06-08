// Maps Clerk authentication to Prisma User rows (clerkId → users.id for FK relations).
// Server-only: import from Server Components, Server Actions, and route handlers only.

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/db";

/** Ensures a Prisma User exists for the signed-in Clerk user; returns null if signed out. */
export async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new Error("Clerk user is missing a primary email address.");
  }

  return prisma.user.upsert({
    where: { clerkId },
    create: {
      clerkId,
      email,
      name: clerkUser?.fullName ?? null,
      image: clerkUser?.imageUrl ?? null,
    },
    update: {
      email,
      name: clerkUser?.fullName ?? null,
      image: clerkUser?.imageUrl ?? null,
    },
  });
}

/** Requires Clerk sign-in and a synced Prisma user; redirects to /login when absent. */
export async function requireDbUser() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const dbUser = await getDbUser();
  if (!dbUser) redirect("/login");

  return dbUser;
}
