"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds, readVisibility } from "@/lib/items";
import { uploadPhoto } from "@/lib/photos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim() || null;
  if (!title || !startsAt) return;

  const groupIds = readGroupIds(formData);
  const coverFile = formData.get("cover_photo");
  const coverPhoto = coverFile instanceof File ? await uploadPhoto(coverFile) : null;

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      group_id: groupIds[0] ?? null,
      title,
      starts_at: new Date(startsAt).toISOString(),
      location,
      cover_photo: coverPhoto,
      visibility: readVisibility(formData),
    })
    .select("id")
    .single();

  if (error || !event) return;

  await tagItem(supabase, "event", event.id, groupIds);
  redirect("/events");
}

export async function rsvpToEvent(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) return;

  await supabase.from("rsvps").upsert({ event_id: eventId, profile_id: user.id });
  revalidatePath("/events");
}
