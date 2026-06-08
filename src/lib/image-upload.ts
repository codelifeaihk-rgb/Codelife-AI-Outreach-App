// src/lib/image-upload.ts
// Handles banner and closing image storage via Supabase Storage.
// Images stored here are served from a reliable CDN URL.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadEmailImage(
  file: File,
  userId: string,
  type: "banner" | "closing"
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `email-images/${userId}/${type}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("codelife-assets")
    .upload(path, file, {
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from("codelife-assets")
    .getPublicUrl(path);

  return data.publicUrl;
}

// Default images — reliable public URLs
// Replace these with your own hosted versions for production
export const DEFAULT_IMAGES = {
  banner: "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=600&h=200&q=80",
  // Use a solid color fallback if image fails
  bannerFallback: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='100'%3E%3Crect width='600' height='100' fill='%230f172a'/%3E%3Ctext x='300' y='55' text-anchor='middle' fill='%2338bdf8' font-family='Arial' font-size='20' font-weight='bold'%3ECodeLifeAI Platform%3C/text%3E%3C/svg%3E",
};