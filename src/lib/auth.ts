import { redirect } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

export async function fetchUserGroups(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("group_members")
    .select("groups(id, name)")
    .eq("profile_id", userId);
  type GroupRef = { id: string; name: string };
  return (data ?? [])
    .map((m) => m.groups as unknown as GroupRef | null)
    .filter((g): g is GroupRef => Boolean(g));
}

export type SuggestedGroup = { id: string; name: string; axis: string; memberCount: number };

// One suggestion per axis — the most-populous group on that axis the user
// hasn't already joined. Used for "Groups for you" on the home feed.
export async function fetchSuggestedGroups(
  supabase: SupabaseClient,
  userId: string,
): Promise<SuggestedGroup[]> {
  const { data: joined } = await supabase.from("group_members").select("group_id").eq("profile_id", userId);
  const joinedIds = new Set((joined ?? []).map((j) => j.group_id as string));

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, axis, group_members(profile_id)");

  type Row = { id: string; name: string; axis: string; group_members: { profile_id: string }[] };
  const rows = (groups ?? []) as unknown as Row[];

  const bestPerAxis = new Map<string, SuggestedGroup>();
  for (const g of rows) {
    if (joinedIds.has(g.id)) continue;
    const memberCount = g.group_members.length;
    const existing = bestPerAxis.get(g.axis);
    if (!existing || memberCount > existing.memberCount) {
      bestPerAxis.set(g.axis, { id: g.id, name: g.name, axis: g.axis, memberCount });
    }
  }

  return [...bestPerAxis.values()].sort((a, b) => b.memberCount - a.memberCount);
}
