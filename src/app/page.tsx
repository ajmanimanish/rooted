import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const STAGE_COPY: Record<string, string> = {
  just_arrived: "Here's what people usually sort out in the first few weeks.",
  settling_in: "Here's what's useful as you settle in.",
  long_term: "Here's what's happening in the community.",
};

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl flex-1 px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">
          A place to land, not just to search.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[var(--color-neutral)]">
          Rooted is a trust-first community for people building a life somewhere new.
          Browse freely — sign in when you&apos;re ready to vote, tip, ask, or offer help.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, stage")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("groups(id, name, axis)")
    .eq("profile_id", user.id);

  type GroupRef = { id: string; name: string; axis: string };
  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as GroupRef | null)
    .filter((g): g is GroupRef => Boolean(g));

  const stage = profile?.stage ?? "just_arrived";

  const { data: openRequests } = await supabase
    .from("arrival_help_requests")
    .select("id, traveler_note, arrival_window, languages_needed")
    .eq("status", "open")
    .order("arrival_window", { ascending: true })
    .limit(3);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">
        Welcome back{profile?.name ? `, ${profile.name}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">{STAGE_COPY[stage]}</p>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Your groups
          </h2>
          <Link href="/groups/new" className="text-sm text-[var(--color-primary-deep)]">
            Start a group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-[var(--color-neutral-border)] p-6 text-center">
            <p className="text-sm text-[var(--color-neutral)]">
              You haven&apos;t joined a group yet — groups are how Rooted feels relevant to you.
            </p>
            <Link
              href="/groups"
              className="mt-3 inline-block text-sm font-medium text-[var(--color-primary-deep)]"
            >
              Browse groups →
            </Link>
          </div>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/groups/${g.id}`}
                  className="block rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
                >
                  <p className="font-medium text-[var(--color-ink)]">{g.name}</p>
                  <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
                    {g.axis}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Arrival help needed
          </h2>
          <Link href="/arrival-help/new" className="text-sm font-medium text-[var(--color-primary-deep)]">
            Ask for arrival help
          </Link>
        </div>

        {!openRequests || openRequests.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-neutral)]">
            No open requests right now. Someone landing alone? You can offer help, or ask for it.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {openRequests.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/arrival-help/${r.id}`}
                  className="block rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 hover:border-[var(--color-primary)]"
                >
                  <p className="text-sm text-[var(--color-ink)]">{r.traveler_note}</p>
                  <p className="text-xs text-[var(--color-neutral-light)]">
                    {new Date(r.arrival_window).toLocaleDateString()} · {(r.languages_needed ?? []).join(", ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
