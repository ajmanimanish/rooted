import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchTrustedItemIds, NEVER_EMPTY_THRESHOLD } from "@/lib/items";
import { reachableWithinRange } from "@/lib/trust";
import EmptyState from "@/components/EmptyState";
import TrustedToggle from "@/components/TrustedToggle";
import WidenedScopeBanner from "@/components/WidenedScopeBanner";
import AskVoterButton from "@/components/AskVoterButton";
import { tipResource } from "@/app/resources/actions";

type ResourceRow = {
  id: string;
  category: string;
  name: string;
  contact_note: string | null;
  resource_votes: { id: string; tip: string | null; created_at: string; voter_id: string; profiles: { name: string } | null }[];
};

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ trusted?: string }>;
}) {
  const { trusted } = await searchParams;
  const showTrusted = trusted === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const selectCols = "id, category, name, contact_note, resource_votes(id, tip, created_at, voter_id, profiles(name))";
  let resources: ResourceRow[] = [];
  let widened = false;
  let trustedCount = 0;

  if (showTrusted && user) {
    const ids = await fetchTrustedItemIds(supabase, "resource", user.id);
    trustedCount = ids.length;
    if (ids.length >= NEVER_EMPTY_THRESHOLD) {
      const { data } = await supabase.from("resources").select(selectCols).in("id", ids);
      resources = (data ?? []) as unknown as ResourceRow[];
    } else {
      widened = true;
    }
  }

  if (!showTrusted || widened) {
    const { data } = await supabase.from("resources").select(selectCols);
    resources = (data ?? []) as unknown as ResourceRow[];
  }

  // Most-endorsed first — this ordering is what makes the #1 card "top-ranked".
  resources = [...resources].sort((a, b) => b.resource_votes.length - a.resource_votes.length);
  const topResourceId = resources[0]?.resource_votes.length > 0 ? resources[0].id : null;

  const reachableVoters = user ? await reachableWithinRange(supabase, user.id) : new Set<string>();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Resources</h1>
        <Link
          href="/resources/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Add a resource
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        A vetted provider directory, with the same vote/tip engine as Knowledge.
      </p>

      {user && (
        <div className="mt-4">
          <TrustedToggle active={showTrusted && !widened} widened={widened} />
        </div>
      )}

      <div className="mt-6">
        {widened && <WidenedScopeBanner count={trustedCount} />}
        {resources.length === 0 ? (
          <EmptyState
            message="No resources yet. Be the first to add one."
            ctaHref="/resources/new"
            ctaLabel="Add a resource"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {resources.map((r) => {
              const lastTipped = r.resource_votes
                .map((v) => v.created_at)
                .sort()
                .at(-1);
              return (
                <li key={r.id} className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{r.category}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <p className="font-medium text-[var(--color-ink)]">
                      {r.id === topResourceId && "🏆 "}
                      {r.name}
                    </p>
                    <p className="text-sm text-[var(--color-neutral)]">
                      {r.resource_votes.length} tip{r.resource_votes.length === 1 ? "" : "s"}
                      {lastTipped ? ` · Last tipped: ${new Date(lastTipped).toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : ""}
                    </p>
                  </div>
                  {r.contact_note && <p className="mt-1 text-sm text-[var(--color-neutral)]">{r.contact_note}</p>}

                  {r.resource_votes.filter((v) => v.tip).length > 0 && (
                    <ul className="mt-2 flex flex-col gap-2">
                      {r.resource_votes
                        .filter((v) => v.tip)
                        .map((v) => (
                          <li key={v.id} className="text-sm text-[var(--color-neutral)]">
                            <p>
                              &ldquo;{v.tip}&rdquo;
                              {v.profiles?.name && <span className="text-[var(--color-neutral-light)]"> — {v.profiles.name}</span>}
                            </p>
                            {r.id === topResourceId && user && v.voter_id !== user.id && reachableVoters.has(v.voter_id) && (
                              <AskVoterButton
                                toId={v.voter_id}
                                toName={v.profiles?.name ?? "them"}
                                contextType="resource"
                                contextId={r.id}
                                returnTo="/resources"
                              />
                            )}
                          </li>
                        ))}
                    </ul>
                  )}

                  {user && (
                    <form action={tipResource} className="mt-3 flex items-center gap-2">
                      <input type="hidden" name="resource_id" value={r.id} />
                      <input
                        name="tip"
                        placeholder="Optional tip (≤180 chars)"
                        maxLength={180}
                        className="flex-1 rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
                      >
                        Endorse
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
