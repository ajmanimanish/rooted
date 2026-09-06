"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds, readVisibility } from "@/lib/items";
import { uploadPhotos } from "@/lib/photos";
import { redirect } from "next/navigation";

export async function createHousingListing(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const kind = String(formData.get("kind") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const neighborhood = String(formData.get("neighborhood") ?? "").trim() || null;
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!["available", "seeking", "handover"].includes(kind) || !title) return;

  let handoverKnowledge: Record<string, string> | null = null;
  if (kind === "handover") {
    handoverKnowledge = {
      plumber: String(formData.get("handover_plumber") ?? "").trim(),
      tax_adviser: String(formData.get("handover_tax_adviser") ?? "").trim(),
      doctor: String(formData.get("handover_doctor") ?? "").trim(),
      tips: String(formData.get("handover_tips") ?? "").trim(),
    };
  }

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const photos = await uploadPhotos(photoFiles);

  const { data: listing, error } = await supabase
    .from("housing_listings")
    .insert({
      author_id: user.id,
      kind,
      title,
      neighborhood,
      price: priceRaw ? Number(priceRaw) : null,
      description,
      handover_knowledge: handoverKnowledge,
      photos,
      visibility: readVisibility(formData),
    })
    .select("id")
    .single();

  if (error || !listing) return;

  await tagItem(supabase, "listing", listing.id, readGroupIds(formData));
  redirect(`/housing/${listing.id}`);
}
