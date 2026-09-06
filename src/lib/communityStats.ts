import { SupabaseClient } from "@supabase/supabase-js";

export type CommunityStats = {
  verifiedMembers: number;
  activeGroups: number;
  countriesOfOrigin: number;
  eventsThisMonth: number;
};

export async function fetchCommunityStats(supabase: SupabaseClient): Promise<CommunityStats> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [{ count: verifiedMembers }, { count: activeGroups }, { data: origins }, { count: eventsThisMonth }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .or("linkedin_verified.eq.true,employer_verified.eq.true,verified_local.eq.true"),
      supabase.from("groups").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("origin_country").not("origin_country", "is", null),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", monthStart.toISOString()),
    ]);

  const countriesOfOrigin = new Set((origins ?? []).map((p) => p.origin_country)).size;

  return {
    verifiedMembers: verifiedMembers ?? 0,
    activeGroups: activeGroups ?? 0,
    countriesOfOrigin,
    eventsThisMonth: eventsThisMonth ?? 0,
  };
}
