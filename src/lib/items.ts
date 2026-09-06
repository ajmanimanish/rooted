import { SupabaseClient } from "@supabase/supabase-js";

// Every commons item (housing, question, resource, marketplace listing, event)
// shares this tagging shape: item_type + item_id -> group_id, plus a
// visibility level that controls who can even see the row (enforced by RLS).
export type ItemType = "listing" | "question" | "resource" | "event" | "arrival_help";

// Below this many results, the "Trusted by my groups" scope auto-widens to
// Everyone rather than showing a thin, discouraging list — Phase 8's
// never-empty rule.
export const NEVER_EMPTY_THRESHOLD = 3;

export async function tagItem(
  supabase: SupabaseClient,
  itemType: ItemType,
  itemId: string,
  groupIds: string[],
) {
  if (groupIds.length === 0) return;
  await supabase.from("item_group_tags").insert(
    groupIds.map((groupId) => ({ item_type: itemType, item_id: itemId, group_id: groupId })),
  );
}

export function readGroupIds(formData: FormData): string[] {
  return formData.getAll("group_ids").map(String).filter(Boolean);
}

export function readVisibility(formData: FormData): "general" | "tagged" | "group_only" {
  const v = String(formData.get("visibility") ?? "general");
  return v === "tagged" || v === "group_only" ? v : "general";
}

// Reused by Housing/Knowledge/Resources list views for the "Trusted by this
// group" toggle: narrow a table's rows down to only those tagged to a group
// the current user belongs to. One query pattern, three callers.
export async function fetchTrustedItemIds(
  supabase: SupabaseClient,
  itemType: ItemType,
  userId: string,
): Promise<string[]> {
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("profile_id", userId);

  const groupIds = (memberships ?? []).map((m) => m.group_id as string);
  if (groupIds.length === 0) return [];

  const { data: tags } = await supabase
    .from("item_group_tags")
    .select("item_id")
    .eq("item_type", itemType)
    .in("group_id", groupIds);

  return [...new Set((tags ?? []).map((t) => t.item_id as string))];
}
