import { createClient } from "@/lib/supabase/server";
import { fetchCommunityStats } from "@/lib/communityStats";

export default async function SiteFooter() {
  const supabase = await createClient();
  const stats = await fetchCommunityStats(supabase);

  return (
    <footer className="mt-auto border-t border-[var(--color-neutral-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
        <div>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{stats.verifiedMembers}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">Verified members</p>
        </div>
        <div>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{stats.activeGroups}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">Active groups</p>
        </div>
        <div>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{stats.countriesOfOrigin}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">Countries of origin</p>
        </div>
        <div>
          <p className="font-serif text-2xl text-[var(--color-ink)]">{stats.eventsThisMonth}</p>
          <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">Events this month</p>
        </div>
      </div>
      <div className="border-t border-[var(--color-neutral-border)] px-4 py-3 text-center text-xs text-[var(--color-neutral-light)]">
        Rooted — Düsseldorf
      </div>
    </footer>
  );
}
