"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds, readVisibility } from "@/lib/items";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createResource(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const contactNote = String(formData.get("contact_note") ?? "").trim() || null;

  if (!category || !name) return;

  const { data: resource, error } = await supabase
    .from("resources")
    .insert({ category, name, contact_note: contactNote, created_by: user.id, visibility: readVisibility(formData) })
    .select("id")
    .single();

  if (error || !resource) return;

  await tagItem(supabase, "resource", resource.id, readGroupIds(formData));
  redirect("/resources");
}

export async function tipResource(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const resourceId = String(formData.get("resource_id") ?? "");
  const tip = String(formData.get("tip") ?? "").trim() || null;
  if (!resourceId) return;

  await supabase
    .from("resource_votes")
    .upsert(
      { resource_id: resourceId, voter_id: user.id, tip, created_at: new Date().toISOString() },
      { onConflict: "resource_id,voter_id" },
    );

  revalidatePath("/resources");
}
