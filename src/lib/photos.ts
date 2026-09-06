"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

// Uploads go through the service-role client (bypasses storage RLS) rather
// than the user's own session — simplest path to a working upload without
// needing separate storage.objects policies. Still gated by requireUser, so
// only a signed-in caller can reach this.
export async function uploadPhoto(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const supabase = await createClient();
  const user = await requireUser(supabase);

  const admin = createServiceRoleClient();
  const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await admin.storage.from("photos").upload(path, file, {
    contentType: file.type,
  });
  if (error) return null;

  const { data } = admin.storage.from("photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPhotos(files: File[]): Promise<string[]> {
  const urls = await Promise.all(files.filter((f) => f.size > 0).map(uploadPhoto));
  return urls.filter((u): u is string => Boolean(u));
}
