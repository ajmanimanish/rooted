import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name, axis, description")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Groups</h1>
        <Link
          href="/groups/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Start a group
        </Link>
      </div>

      {!groups || groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            message="No groups yet — be the first to start one for your nationality, situation, interest, or profession."
            ctaHref="/groups/new"
            ctaLabel="Start a group"
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link
                href={`/groups/${g.id}`}
                className="block rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
              >
                <p className="font-medium text-[var(--color-ink)]">{g.name}</p>
                <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{g.axis}</p>
                {g.description && (
                  <p className="mt-1 text-sm text-[var(--color-neutral)]">{g.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
