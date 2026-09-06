import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import AxisSection from "@/components/AxisSection";
import { joinGroup } from "@/app/groups/actions";

const AXIS_LABEL: Record<string, string> = {
  nationality: "Nationality & region",
  situation: "Life situation",
  interest: "Interests",
  profession: "Profession",
  topic: "Topic",
};
const AXIS_ORDER = ["nationality", "situation", "interest", "profession", "topic"];

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, axis, description, group_members(profile_id)")
    .order("name", { ascending: true });

  type Row = { id: string; name: string; axis: string; description: string | null; group_members: { profile_id: string }[] };
  const rows = (groups ?? []) as unknown as Row[];

  const byAxis = new Map<string, Row[]>();
  for (const g of rows) {
    byAxis.set(g.axis, [...(byAxis.get(g.axis) ?? []), g]);
  }
  const orderedAxes = [...byAxis.keys()].sort(
    (a, b) => AXIS_ORDER.indexOf(a) - AXIS_ORDER.indexOf(b),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[var(--color-ink)]">Groups</h1>
          <p className="mt-1 text-sm text-[var(--color-neutral)]">
            Where expats actually belong — by background, by life, by what you&apos;re into. Never by employer or street.
          </p>
        </div>
        <Link
          href="/groups/new"
          className="shrink-0 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Start a group
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="No groups yet — be the first to start one for your nationality, situation, interest, or profession."
            ctaHref="/groups/new"
            ctaLabel="Start a group"
          />
        </div>
      ) : (
        orderedAxes.map((axis) => {
          const axisGroups = byAxis.get(axis)!;
          return (
            <AxisSection key={axis} title={AXIS_LABEL[axis] ?? axis} count={axisGroups.length}>
              {axisGroups.map((g) => {
                const isMember = Boolean(user && g.group_members.some((m) => m.profile_id === user.id));
                return (
                  <div
                    key={g.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4"
                  >
                    <Link href={`/groups/${g.id}`} className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-ink)] hover:text-[var(--color-primary-deep)]">{g.name}</p>
                      <p className="text-sm text-[var(--color-neutral-light)]">{g.group_members.length} members</p>
                    </Link>
                    {isMember ? (
                      <span className="shrink-0 text-sm text-[var(--color-neutral-light)]">Joined</span>
                    ) : (
                      <form action={joinGroup.bind(null, g.id)} className="shrink-0">
                        <button type="submit" className="rounded-full border border-[var(--color-neutral-border)] px-3 py-1 text-sm text-[var(--color-primary-deep)] hover:border-[var(--color-primary)]">
                          + Join
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </AxisSection>
          );
        })
      )}
    </main>
  );
}
