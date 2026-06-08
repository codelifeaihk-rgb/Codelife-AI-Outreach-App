// src/app/api/webhooks/clerk/route.ts
// Clerk webhook handler — syncs Clerk users to Supabase users table.
// Triggered automatically when users sign up, update, or delete their account.

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/src/lib/db";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // Get headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Verify webhook signature
  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  const eventType = evt.type;

  // Handle user created
  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { clerkId: id },
      update: { email, name, image: image_url },
      create: {
        clerkId: id,
        email,
        name,
        image: image_url,
      },
    });

    console.log(`User created in DB: ${email}`);
  }

  // Handle user updated
  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const email = email_addresses[0]?.email_address;
    if (!email) return new Response("No email", { status: 400 });

    const name = [first_name, last_name].filter(Boolean).join(" ") || null;

    await prisma.user.upsert({
      where: { clerkId: id },
      update: { email, name, image: image_url },
      create: {
        clerkId: id,
        email,
        name,
        image: image_url,
      },
    });

    console.log(`User updated in DB: ${email}`);
  }

  // Handle user deleted
  if (eventType === "user.deleted") {
    const { id } = evt.data;
    if (!id) return new Response("No user id", { status: 400 });

    await prisma.user.deleteMany({
      where: { clerkId: id },
    });

    console.log(`User deleted from DB: ${id}`);
  }

  return new Response("Webhook processed", { status: 200 });
}