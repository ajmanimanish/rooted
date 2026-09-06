import { createClient } from "@/lib/supabase/server";

// Persistent while any seeded demo profile exists — not dismissible, matching
// the prototype's behavior — so real users understand mixed data on first load.
export default async function DemoDataBanner() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_demo", true)
    .limit(1);

  if (!count) return null;

  return (
    <div className="bg-[var(--color-ink)] px-4 py-1.5 text-center text-xs text-white">
      DEMO DATA — people, groups, and posts marked <span className="font-semibold">Demo</span> are fictional, shown so the community doesn&apos;t look empty on day one.
    </div>
  );
}
