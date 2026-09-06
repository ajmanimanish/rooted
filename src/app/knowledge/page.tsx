import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchTrustedItemIds, NEVER_EMPTY_THRESHOLD } from "@/lib/items";
import EmptyState from "@/components/EmptyState";
import TrustedToggle from "@/components/TrustedToggle";
import WidenedScopeBanner from "@/components/WidenedScopeBanner";

type QuestionRow = {
  id: string;
  title: string;
  topic: string | null;
  format: string;
  question_options: { votes: { id: string }[] }[];
  deep_answers: { id: string }[];
};

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

  let questions: QuestionRow[] = [];
  let widened = false;
  let trustedCount = 0;
  const selectCols = "id, title, topic, format, question_options(votes(id)), deep_answers(id)";

  if (showTrusted && user) {
    const ids = await fetchTrustedItemIds(supabase, "question", user.id);
    trustedCount = ids.length;
    if (ids.length >= NEVER_EMPTY_THRESHOLD) {
      const { data } = await supabase
        .from("questions")
        .select(selectCols)
        .in("id", ids)
        .order("created_at", { ascending: false });
      questions = (data ?? []) as unknown as QuestionRow[];
    } else {
      widened = true;
    }
  }

  if (!showTrusted || widened) {
    const { data } = await supabase
      .from("questions")
      .select(selectCols)
      .order("created_at", { ascending: false });
    questions = (data ?? []) as unknown as QuestionRow[];
  }

  const judgmentCalls = questions.filter((q) => q.format === "deep_answer");
  const polls = questions.filter((q) => q.format !== "deep_answer");

  const byTopic = new Map<string, QuestionRow[]>();
  for (const q of polls) {
    const key = q.topic || "General";
    byTopic.set(key, [...(byTopic.get(key) ?? []), q]);
  }
  const topics = [...byTopic.keys()].sort();

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
        Quick, verified answers. A tap is a full contribution — write a line only if you have one.
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
          <>
            {topics.map((topic) => (
              <section key={topic} className="mb-8">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">
                  {topic}
                </h2>
                <ul className="mt-2 flex flex-col gap-2">
                  {byTopic.get(topic)!.map((q) => {
                    const voteCount = q.question_options.reduce((sum, o) => sum + o.votes.length, 0);
                    return (
                      <li key={q.id}>
                        <Link
                          href={`/knowledge/${q.id}`}
                          className="block rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
                        >
                          <p className="font-medium text-[var(--color-ink)]">{q.title}</p>
                          <p className="text-sm text-[var(--color-neutral)]">{voteCount} votes</p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            {judgmentCalls.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">
                  Judgment calls
                </h2>
                <p className="text-xs text-[var(--color-neutral-light)]">rare, written by people who&apos;ve done it</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {judgmentCalls.map((q) => (
                    <li key={q.id}>
                      <Link
                        href={`/knowledge/${q.id}`}
                        className="block rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-primary)]"
                      >
                        <p className="font-medium text-[var(--color-ink)]">{q.title}</p>
                        <p className="text-sm text-[var(--color-primary-deep)]">
                          {q.deep_answers.length} written answer{q.deep_answers.length === 1 ? "" : "s"} →
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
