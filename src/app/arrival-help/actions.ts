"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { tagItem, readGroupIds } from "@/lib/items";
import { redirect } from "next/navigation";

export async function createArrivalHelpRequest(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const travelerNote = String(formData.get("traveler_note") ?? "").trim();
  const arrivalWindow = String(formData.get("arrival_window") ?? "").trim();
  const flightInfo = String(formData.get("flight_info") ?? "").trim() || null;
  const languagesNeeded = String(formData.get("languages_needed") ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!travelerNote || !arrivalWindow || languagesNeeded.length === 0) return;

  const { data: request, error } = await supabase
    .from("arrival_help_requests")
    .insert({
      requester_id: user.id,
      traveler_note: travelerNote,
      languages_needed: languagesNeeded,
      arrival_window: new Date(arrivalWindow).toISOString(),
      flight_info: flightInfo,
    })
    .select("id")
    .single();

  if (error || !request) return;

  await tagItem(supabase, "arrival_help", request.id, readGroupIds(formData));
  redirect(`/arrival-help/${request.id}`);
}

// The real gate is the can_offer_arrival_help() Postgres function + RLS
// policy on arrival_help_offers — this insert fails at the database level
// for anyone who isn't verified with >=2 vouches, regardless of what the
// UI shows.
export async function offerHelp(formData: FormData) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const requestId = String(formData.get("request_id") ?? "");
  if (!requestId) return;

  await supabase.from("arrival_help_offers").insert({ request_id: requestId, helper_id: user.id });
  redirect(`/arrival-help/${requestId}`);
}
