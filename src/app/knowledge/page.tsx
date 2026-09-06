import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchTrustedItemIds, NEVER_EMPTY_THRESHOLD } from "@/lib/items";
import EmptyState from "@/components/EmptyState";
import TrustedToggle from "@/components/TrustedToggle";
import WidenedScopeBanner from "@/components/WidenedScopeBanner";

export default async function KnowledgePage({
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

  let questions: { id: string; title: string; topic: string | null; question_options: { votes: { id: string }[] }[] }[] = [];
  let widened = false;
  let trustedCount = 0;

  if (showTrusted && user) {
    const ids = await fetchTrustedItemIds(supabase, "question", user.id);
    trustedCount = ids.length;
    if (ids.length >= NEVER_EMPTY_THRESHOLD) {
      const { data } = await supabase
        .from("questions")
        .select("id, title, topic, question_options(votes(id))")
        .in("id", ids)
        .order("created_at", { ascending: false });
      questions = data ?? [];
    } else {
      widened = true;
    }
  }

  if (!showTrusted || widened) {
    const { data } = await supabase
      .from("questions")
      .select("id, title, topic, question_options(votes(id))")
      .order("created_at", { ascending: false });
    questions = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Knowledge</h1>
        <Link
          href="/knowledge/new"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Ask a question
        </Link>
      </div>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Poll-style questions with votes and short tips, peer-weighted by the groups people belong to.
      </p>

      {user && (
        <div className="mt-4">
          <TrustedToggle active={showTrusted && !widened} widened={widened} />
        </div>
      )}

      <div className="mt-6">
        {widened && <WidenedScopeBanner count={trustedCount} />}
        {questions.length === 0 ? (
          <EmptyState
            message="No questions yet. Be the first to ask one."
            ctaHref="/knowledge/new"
            ctaLabel="Ask a question"
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {questions.map((q) => {
              const voteCount = q.question_options.reduce((sum, o) => sum + o.votes.length, 0);
              return (
                <li key={q.id}>
                  <Link
                    href={`/knowledge/${q.id}`}
                    className="block rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
                  >
                    {q.topic && (
                      <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{q.topic}</p>
                    )}
                    <p className="mt-1 font-medium text-[var(--color-ink)]">{q.title}</p>
                    <p className="text-sm text-[var(--color-neutral)]">{voteCount} votes</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
