import { SupabaseClient } from "@supabase/supabase-js";
import { reachableWithinRange } from "@/lib/trust";

export type RankedHelper = {
  id: string;
  name: string;
  linkedinVerified: boolean;
  employerVerified: boolean;
  vouchCount: number;
  reason: "shared_group" | "vouch_proximity" | "unconnected";
};

// Ranks eligible helpers (verified + >=2 vouches — the same bar the DB
// enforces on the actual offer) so people connected to the requester show
// above unconnected verified strangers, per the build plan.
export async function fetchRankedHelpers(
  supabase: SupabaseClient,
  requesterId: string,
): Promise<RankedHelper[]> {
  const { data: allVouches } = await supabase.from("vouches").select("vouchee_id");
  const vouchCounts = new Map<string, number>();
  for (const v of allVouches ?? []) {
    vouchCounts.set(v.vouchee_id, (vouchCounts.get(v.vouchee_id) ?? 0) + 1);
  }
  const eligibleIds = [...vouchCounts.entries()]
    .filter(([id, count]) => count >= 2 && id !== requesterId)
    .map(([id]) => id);

  if (eligibleIds.length === 0) return [];

  const { data: eligibleProfiles } = await supabase
    .from("profiles")
    .select("id, name, linkedin_verified, employer_verified")
    .in("id", eligibleIds)
    .or("linkedin_verified.eq.true,employer_verified.eq.true");

  if (!eligibleProfiles || eligibleProfiles.length === 0) return [];

  const { data: requesterGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("profile_id", requesterId);
  const groupIds = (requesterGroups ?? []).map((g) => g.group_id as string);

  const sharedGroupIds = new Set<string>();
  if (groupIds.length > 0) {
    const { data: coMembers } = await supabase
      .from("group_members")
      .select("profile_id")
      .in("group_id", groupIds)
      .neq("profile_id", requesterId);
    for (const m of coMembers ?? []) sharedGroupIds.add(m.profile_id as string);
  }

  const vouchProximityIds = await reachableWithinRange(supabase, requesterId, 3);

  const ranked: RankedHelper[] = eligibleProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    linkedinVerified: p.linkedin_verified,
    employerVerified: p.employer_verified,
    vouchCount: vouchCounts.get(p.id) ?? 0,
    reason: sharedGroupIds.has(p.id)
      ? "shared_group"
      : vouchProximityIds.has(p.id)
        ? "vouch_proximity"
        : "unconnected",
  }));

  const rank = { shared_group: 0, vouch_proximity: 1, unconnected: 2 };
  return ranked.sort((a, b) => rank[a.reason] - rank[b.reason]);
}
