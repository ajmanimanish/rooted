import { SupabaseClient } from "@supabase/supabase-js";

export type ActivityEntry = {
  id: string;
  kind: "Housing" | "Marketplace" | "Question" | "Resource" | "Event" | "Arrival Help";
  title: string;
  author: string;
  createdAt: string;
  href: string;
};

// The group activity feed: everything tagged to this group across every
// pillar table, newest first, attributed to whoever posted it. item_type
// 'listing' is shared by housing_listings and marketplace_listings (per
// schema), so both are checked for each tagged id.
export async function fetchGroupActivity(
  supabase: SupabaseClient,
  groupId: string,
): Promise<ActivityEntry[]> {
  const { data: tags } = await supabase
    .from("item_group_tags")
    .select("item_type, item_id")
    .eq("group_id", groupId);

  const idsFor = (type: string) =>
    (tags ?? []).filter((t) => t.item_type === type).map((t) => t.item_id as string);

  const listingIds = idsFor("listing");
  const questionIds = idsFor("question");
  const resourceIds = idsFor("resource");
  const eventIds = idsFor("event");
  const arrivalHelpIds = idsFor("arrival_help");

  const entries: ActivityEntry[] = [];

  if (listingIds.length > 0) {
    const [{ data: housing }, { data: marketplace }] = await Promise.all([
      supabase
        .from("housing_listings")
        .select("id, title, created_at, profiles(name)")
        .in("id", listingIds),
      supabase
        .from("marketplace_listings")
        .select("id, title, created_at, profiles(name)")
        .in("id", listingIds),
    ]);
    for (const row of housing ?? []) {
      entries.push({
        id: row.id,
        kind: "Housing",
        title: row.title,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/housing/${row.id}`,
      });
    }
    for (const row of marketplace ?? []) {
      entries.push({
        id: row.id,
        kind: "Marketplace",
        title: row.title,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/marketplace`,
      });
    }
  }

  if (questionIds.length > 0) {
    const { data: questions } = await supabase
      .from("questions")
      .select("id, title, created_at, profiles(name)")
      .in("id", questionIds);
    for (const row of questions ?? []) {
      entries.push({
        id: row.id,
        kind: "Question",
        title: row.title,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/knowledge/${row.id}`,
      });
    }
  }

  if (resourceIds.length > 0) {
    const { data: resources } = await supabase
      .from("resources")
      .select("id, name, created_at, profiles(name)")
      .in("id", resourceIds);
    for (const row of resources ?? []) {
      entries.push({
        id: row.id,
        kind: "Resource",
        title: row.name,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/resources`,
      });
    }
  }

  if (eventIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("id, title, created_at, profiles(name)")
      .in("id", eventIds);
    for (const row of events ?? []) {
      entries.push({
        id: row.id,
        kind: "Event",
        title: row.title,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/events`,
      });
    }
  }

  if (arrivalHelpIds.length > 0) {
    const { data: requests } = await supabase
      .from("arrival_help_requests")
      .select("id, traveler_note, created_at, profiles(name)")
      .in("id", arrivalHelpIds);
    for (const row of requests ?? []) {
      entries.push({
        id: row.id,
        kind: "Arrival Help",
        title: row.traveler_note,
        author: (row.profiles as unknown as { name: string } | null)?.name ?? "Someone",
        createdAt: row.created_at,
        href: `/arrival-help/${row.id}`,
      });
    }
  }

  return entries.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
