import { SupabaseClient } from "@supabase/supabase-js";

// "Top pick in [Group]" badges: for each group the viewer belongs to, find
// which option won among that group's members' votes. Only computed for the
// viewer's own groups — that's what makes it "peer-weighted" rather than a
// global ranking restated per group.
export async function computePeerBadges(
  supabase: SupabaseClient,
  viewerId: string,
  optionVoterIds: Record<string, string[]>, // optionId -> voterIds who voted for it
): Promise<Record<string, string[]>> {
  const { data: memberships } = await supabase
    .from("group_members")
    .select("groups(id, name)")
    .eq("profile_id", viewerId);

  type GroupRef = { id: string; name: string };
  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as GroupRef | null)
    .filter((g): g is GroupRef => Boolean(g));

  const badges: Record<string, string[]> = {};
  if (groups.length === 0) return badges;

  const { data: allMembers } = await supabase
    .from("group_members")
    .select("group_id, profile_id")
    .in("group_id", groups.map((g) => g.id));

  for (const group of groups) {
    const memberIds = new Set(
      (allMembers ?? []).filter((m) => m.group_id === group.id).map((m) => m.profile_id as string),
    );

    let topOptionId: string | null = null;
    let topCount = 0;
    for (const [optionId, voterIds] of Object.entries(optionVoterIds)) {
      const count = voterIds.filter((v) => memberIds.has(v)).length;
      if (count > topCount) {
        topCount = count;
        topOptionId = optionId;
      }
    }

    if (topOptionId && topCount > 0) {
      badges[topOptionId] = [...(badges[topOptionId] ?? []), `Top pick in ${group.name}`];
    }
  }

  return badges;
}
