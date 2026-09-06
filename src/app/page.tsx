import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchSuggestedGroups } from "@/lib/auth";
import { joinGroup } from "@/app/groups/actions";
import StageSelector from "@/components/StageSelector";
import IntelTicker from "@/components/IntelTicker";
import ChecklistWidget from "@/components/ChecklistWidget";

const STAGE_COPY: Record<string, string> = {
  just_arrived: "Here's what people usually sort out in the first few weeks.",
  settling_in: "Here's what's useful as you settle in.",
  long_term: "Here's what's happening in the community.",
};

const AXIS_LABEL: Record<string, string> = {
  nationality: "Nationality & region",
  situation: "Life situation",
  interest: "Interests",
  profession: "Profession",
  topic: "Topic",
};

function formatArrival(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} · arriving ${time}`;
}

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
  const suggestedGroups = await fetchSuggestedGroups(supabase, user.id);

  const { data: openRequests } = await supabase
    .from("arrival_help_requests")
    .select("id, traveler_note, arrival_window, languages_needed, requester_id, profiles(name, linkedin_verified, employer_verified)")
    .eq("status", "open")
    .order("arrival_window", { ascending: true })
    .limit(3);

  const requesterIds = (openRequests ?? []).map((r) => r.requester_id);
  const vouchCounts = new Map<string, number>();
  if (requesterIds.length > 0) {
    const { data: vouches } = await supabase.from("vouches").select("vouchee_id").in("vouchee_id", requesterIds);
    for (const v of vouches ?? []) vouchCounts.set(v.vouchee_id, (vouchCounts.get(v.vouchee_id) ?? 0) + 1);
  }

  const { data: intelItems } = await supabase
    .from("intel_items")
    .select("id, category, label, value, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: checklistDone } = await supabase
    .from("checklist_progress")
    .select("item_key")
    .eq("profile_id", user.id);
  const completedKeys = (checklistDone ?? []).map((c) => c.item_key);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Your Düsseldorf, your people.</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">{STAGE_COPY[stage]}</p>

      <div className="mt-4">
        <StageSelector current={stage} />
      </div>

      <section className="mt-6 rounded-xl bg-[var(--color-accent)]/10 p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">The Rooted loop</p>
          <Link href="/housing?kind=handover" className="text-sm font-medium text-[var(--color-primary-deep)]">
            See handovers →
          </Link>
        </div>
        <p className="mt-1 font-medium text-[var(--color-ink)]">
          One member&apos;s departure is the next member&apos;s flat, furniture, and address book.
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-neutral)]">
          Member leaves <span className="text-[var(--color-neutral-light)]">→</span> Posts a handover{" "}
          <span className="text-[var(--color-neutral-light)]">→</span> Newcomer verifies{" "}
          <span className="text-[var(--color-neutral-light)]">→</span> Settles in, joins groups
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link href="/groups/new" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-primary)]">
          + Start a group
        </Link>
        <Link href="/knowledge/new" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-primary)]">
          + Ask a question
        </Link>
        <Link href="/events/new" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-primary)]">
          + Post an event
        </Link>
        <Link href="/marketplace/new" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-primary)]">
          + List something
        </Link>
        <Link href="/arrival-help/new" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-primary)]">
          Someone landing alone? Ask for arrival help
        </Link>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Arrival help needed
          </h2>
          <Link href="/arrival-help/new" className="text-sm font-medium text-[var(--color-primary-deep)]">
            Ask for arrival help
          </Link>
        </div>
        <p className="mt-1 text-sm text-[var(--color-neutral-light)]">
          Matched by shared language and community, not by location. Non-monetary, just kindness.
        </p>

        {!openRequests || openRequests.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-neutral)]">
            No open requests right now. Someone landing alone? You can offer help, or ask for it.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {openRequests.map((r) => {
              const requester = r.profiles as unknown as { name: string; linkedin_verified: boolean; employer_verified: boolean } | null;
              const isVerified = Boolean(requester?.linkedin_verified || requester?.employer_verified);
              return (
                <li key={r.id} className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--color-ink)]">
                      {requester?.name ?? "Someone"} <span className="font-normal text-[var(--color-neutral-light)]">· {formatArrival(r.arrival_window)}</span>
                    </p>
                    <Link href={`/arrival-help/${r.id}`} className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1 text-xs font-medium text-[var(--color-primary-deep)] hover:border-[var(--color-primary)]">
                      Offer to help
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-neutral)]">{r.traveler_note}</p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-light)]">
                    Speaks {(r.languages_needed ?? []).join(", ")} · {isVerified ? "Verified member" : "Not yet verified"} · {vouchCounts.get(r.requester_id) ?? 0} vouches
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
            Your groups
          </h2>
          <Link href="/groups" className="text-sm text-[var(--color-primary-deep)]">
            All groups →
          </Link>
        </div>

        {groups.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--color-neutral)]">
            You haven&apos;t joined a group yet — groups are how Rooted feels relevant to you.
          </p>
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

        {suggestedGroups.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Groups for you</p>
            <ul className="mt-2 flex flex-col gap-2">
              {suggestedGroups.map((g) => (
                <li key={g.id} className="flex items-center justify-between rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{AXIS_LABEL[g.axis] ?? g.axis}</p>
                    <Link href={`/groups/${g.id}`} className="font-medium text-[var(--color-ink)] hover:text-[var(--color-primary-deep)]">
                      {g.name}
                    </Link>
                    <span className="ml-2 text-sm text-[var(--color-neutral-light)]">{g.memberCount} members</span>
                  </div>
                  <form action={joinGroup.bind(null, g.id)}>
                    <button type="submit" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1 text-sm text-[var(--color-primary-deep)] hover:border-[var(--color-primary)]">
                      + Join
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <IntelTicker items={intelItems ?? []} />
      <ChecklistWidget completedKeys={completedKeys} />
    </main>
  );
}
