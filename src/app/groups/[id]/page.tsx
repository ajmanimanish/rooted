import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";
import { joinGroup, leaveGroup } from "@/app/groups/actions";
import { fetchGroupActivity } from "@/lib/groupActivity";
import DemoBadge from "@/components/DemoBadge";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, axis, description")
    .eq("id", id)
    .maybeSingle();

  if (!group) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: members } = await supabase
    .from("group_members")
    .select("profile_id, role, profiles(name, is_demo)")
    .eq("group_id", id);

  const isMember = Boolean(user && members?.some((m) => m.profile_id === user.id));
  const activity = await fetchGroupActivity(supabase, id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{group.axis}</p>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">{group.name}</h1>
        <form action={(isMember ? leaveGroup : joinGroup).bind(null, group.id)}>
          <button
            type="submit"
            className={
              isMember
                ? "rounded-lg border border-[var(--color-neutral-border)] px-4 py-2 text-sm text-[var(--color-neutral)] hover:border-[var(--color-ink)]"
                : "rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
            }
          >
            {isMember ? "Leave group" : "Join group"}
          </button>
        </form>
      </div>
      {group.description && <p className="mt-3 text-[var(--color-neutral)]">{group.description}</p>}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
          Members ({members?.length ?? 0})
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(members ?? []).map((m) => {
            const memberProfile = m.profiles as unknown as { name: string; is_demo: boolean } | null;
            return (
              <li key={m.profile_id}>
                <Link
                  href={`/profile/${m.profile_id}`}
                  className="flex items-center gap-1.5 rounded-full bg-[var(--color-base)] px-3 py-1 text-sm text-[var(--color-ink)] hover:bg-[var(--color-neutral-border)]"
                >
                  {memberProfile?.name ?? "Member"}
                  {memberProfile?.is_demo && <DemoBadge />}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
          Activity
        </h2>
        <div className="mt-3">
          {activity.length === 0 ? (
            <EmptyState message="Nothing posted to this group yet. Housing, Knowledge, Resources, Marketplace, and Events posts tagged to this group will show up here." />
          ) : (
            <ul className="flex flex-col gap-2">
              {activity.map((a) => (
                <li key={`${a.kind}-${a.id}`}>
                  <Link
                    href={a.href}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-3 hover:border-[var(--color-primary)]"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{a.kind}</p>
                      <p className="text-[var(--color-ink)]">{a.title}</p>
                    </div>
                    <p className="text-sm text-[var(--color-neutral)]">by {a.author}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
