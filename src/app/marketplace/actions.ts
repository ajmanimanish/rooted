"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds, readVisibility } from "@/lib/items";
import { uploadPhotos } from "@/lib/photos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createMarketplaceListing(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const title = String(formData.get("title") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  if (!title) return;

  const photoFiles = formData.getAll("photos").filter((f): f is File => f instanceof File);
  const photos = await uploadPhotos(photoFiles);

  const { data: listing, error } = await supabase
    .from("marketplace_listings")
    .insert({
      seller_id: user.id,
      title,
      price: priceRaw ? Number(priceRaw) : null,
      description,
      photos,
      visibility: readVisibility(formData),
    })
    .select("id")
    .single();

  if (error || !listing) return;

  await tagItem(supabase, "listing", listing.id, readGroupIds(formData));
  redirect("/marketplace");
}

export async function toggleSold(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const listingId = String(formData.get("listing_id") ?? "");
  const nextStatus = String(formData.get("next_status") ?? "");
  if (!listingId || !["available", "sold"].includes(nextStatus)) return;

  await supabase
    .from("marketplace_listings")
    .update({ status: nextStatus })
    .eq("id", listingId)
    .eq("seller_id", user.id);

  revalidatePath("/marketplace");
}
