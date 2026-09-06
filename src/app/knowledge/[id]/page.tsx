import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { voteOnQuestion, postDeepAnswer, markAnswerHelpful } from "@/app/knowledge/actions";
import { computePeerBadges } from "@/lib/peerBadges";
import { reachableWithinRange } from "@/lib/trust";
import AskVoterButton from "@/components/AskVoterButton";
import DemoBadge from "@/components/DemoBadge";

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: question } = await supabase
    .from("questions")
    .select("id, title, topic, format, profiles(name, is_demo)")
    .eq("id", id)
    .maybeSingle();

  if (!question) notFound();
  const questionAuthorProfile = question.profiles as unknown as { name: string; is_demo: boolean } | null;

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (question.format === "deep_answer") {
    const { data: answers } = await supabase
      .from("deep_answers")
      .select("id, body, helpful_count, created_at, profiles(name)")
      .eq("question_id", id)
      .order("helpful_count", { ascending: false });

    const author = questionAuthorProfile?.name ?? "Someone";

    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {question.topic && (
          <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{question.topic}</p>
        )}
        <h1 className="mt-1 font-serif text-2xl text-[var(--color-ink)]">{question.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-neutral)]">
          Asked by {author}
          {questionAuthorProfile?.is_demo && <DemoBadge />}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {(answers ?? []).map((a) => (
            <div key={a.id} className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4">
              <p className="text-[var(--color-ink)]">{a.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-[var(--color-neutral)]">
                  {(a.profiles as unknown as { name: string } | null)?.name ?? "Someone"}
                </p>
                {currentUser && (
                  <form action={markAnswerHelpful}>
                    <input type="hidden" name="answer_id" value={a.id} />
                    <input type="hidden" name="question_id" value={question.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-[var(--color-primary-deep)]"
                    >
                      Helpful ({a.helpful_count})
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentUser && (
          <form action={postDeepAnswer} className="mt-6 flex flex-col gap-2">
            <input type="hidden" name="question_id" value={question.id} />
            <textarea
              name="body"
              required
              rows={4}
              placeholder="Share a considered answer…"
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="submit"
              className="self-start rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
            >
              Post answer
            </button>
          </form>
        )}
      </main>
    );
  }

  const { data: options } = await supabase
    .from("question_options")
    .select("id, label, votes(id, tip, voter_id, profiles(name))")
    .eq("question_id", id);

  const user = currentUser;
  const author = questionAuthorProfile?.name ?? "Someone";
  type OptionRow = {
    id: string;
    label: string;
    votes: { id: string; tip: string | null; voter_id: string; profiles: { name: string } | null }[];
  };
  const rows = (options ?? []) as unknown as OptionRow[];
  const totalVotes = rows.reduce((sum, o) => sum + o.votes.length, 0);

  const peerBadges = user
    ? await computePeerBadges(
        supabase,
        user.id,
        Object.fromEntries(rows.map((o) => [o.id, o.votes.map((v) => v.voter_id)])),
      )
    : {};

  const reachableVoters = user ? await reachableWithinRange(supabase, user.id) : new Set<string>();
  const sortedRows = [...rows].sort((a, b) => b.votes.length - a.votes.length);
  const topOptionId = totalVotes > 0 ? sortedRows[0]?.id : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      {question.topic && (
        <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{question.topic}</p>
      )}
      <h1 className="mt-1 font-serif text-2xl text-[var(--color-ink)]">{question.title}</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--color-neutral)]">
        Asked by {author}
        {questionAuthorProfile?.is_demo && <DemoBadge />}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {sortedRows
          .map((opt, i) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
            return (
              <div key={opt.id} className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[var(--color-ink)]">
                    {i === 0 && totalVotes > 0 && "🏆 "}
                    {opt.label}
                  </p>
                  <p className="text-sm text-[var(--color-neutral)]">
                    {opt.votes.length} vote{opt.votes.length === 1 ? "" : "s"} ({pct}%)
                  </p>
                </div>
                {(peerBadges[opt.id] ?? []).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {peerBadges[opt.id].map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full bg-[var(--color-accent)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-accent)]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-base)]">
                  <div
                    className="h-1.5 rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {opt.votes.filter((v) => v.tip).length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {opt.votes
                      .filter((v) => v.tip)
                      .map((v) => (
                        <li key={v.id} className="text-sm text-[var(--color-neutral)]">
                          <p>
                            &ldquo;{v.tip}&rdquo;
                            {v.profiles?.name && <span className="text-[var(--color-neutral-light)]"> — {v.profiles.name}</span>}
                          </p>
                          {opt.id === topOptionId && user && v.voter_id !== user.id && reachableVoters.has(v.voter_id) && (
                            <AskVoterButton
                              toId={v.voter_id}
                              toName={v.profiles?.name ?? "them"}
                              contextType="question_option"
                              contextId={opt.id}
                              returnTo={`/knowledge/${question.id}`}
                            />
                          )}
                        </li>
                      ))}
                  </ul>
                )}
                {user && (
                  <form action={voteOnQuestion} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="question_id" value={question.id} />
                    <input type="hidden" name="option_id" value={opt.id} />
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
                      Vote
                    </button>
                  </form>
                )}
              </div>
            );
          })}
      </div>
    </main>
  );
}
