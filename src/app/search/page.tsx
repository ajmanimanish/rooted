import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EmptyState from "@/components/EmptyState";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();

  let groups: { id: string; name: string; axis: string }[] = [];
  let housing: { id: string; title: string }[] = [];
  let questions: { id: string; title: string }[] = [];
  let resources: { id: string; name: string }[] = [];
  let marketplace: { id: string; title: string }[] = [];

  if (query.length >= 2) {
    const pattern = `%${query}%`;
    const [g, h, k, r, m] = await Promise.all([
      supabase.from("groups").select("id, name, axis").ilike("name", pattern).limit(5),
      supabase.from("housing_listings").select("id, title").ilike("title", pattern).limit(5),
      supabase.from("questions").select("id, title").ilike("title", pattern).limit(5),
      supabase.from("resources").select("id, name").ilike("name", pattern).limit(5),
      supabase.from("marketplace_listings").select("id, title").ilike("title", pattern).limit(5),
    ]);
    groups = g.data ?? [];
    housing = h.data ?? [];
    questions = k.data ?? [];
    resources = r.data ?? [];
    marketplace = m.data ?? [];
  }

  const totalResults = groups.length + housing.length + questions.length + resources.length + marketplace.length;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Search</h1>
      <form action="/search" method="get" className="mt-4">
        <input
          name="q"
          defaultValue={query}
          placeholder="Groups, housing, questions, resources…"
          className="w-full rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        />
      </form>

      <div className="mt-6">
        {query.length < 2 ? (
          <p className="text-sm text-[var(--color-neutral-light)]">Type at least 2 characters to search.</p>
        ) : totalResults === 0 ? (
          <EmptyState message={`No results for "${query}".`} />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Groups</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <Link href={`/groups/${g.id}`} className="text-[var(--color-primary-deep)] hover:underline">
                        {g.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {housing.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Housing</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {housing.map((h) => (
                    <li key={h.id}>
                      <Link href={`/housing/${h.id}`} className="text-[var(--color-primary-deep)] hover:underline">
                        {h.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {questions.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Knowledge</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {questions.map((k) => (
                    <li key={k.id}>
                      <Link href={`/knowledge/${k.id}`} className="text-[var(--color-primary-deep)] hover:underline">
                        {k.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {resources.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Resources</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <Link href="/resources" className="text-[var(--color-primary-deep)] hover:underline">
                        {r.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {marketplace.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">Marketplace</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {marketplace.map((m) => (
                    <li key={m.id}>
                      <Link href="/marketplace" className="text-[var(--color-primary-deep)] hover:underline">
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
