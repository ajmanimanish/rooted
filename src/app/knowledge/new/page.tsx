import { createClient } from "@/lib/supabase/server";
import { requireUser, fetchUserGroups } from "@/lib/auth";
import GroupTagFields from "@/components/GroupTagFields";
import { createQuestion } from "@/app/knowledge/actions";

export default async function NewQuestionPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const groups = await fetchUserGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Ask a question</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Poll format by default — give people a few options to vote on, with an optional short tip.
      </p>

      <form action={createQuestion} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Question</span>
          <input
            name="title"
            required
            placeholder="e.g. Best pediatrician for a toddler?"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Format</span>
          <select
            name="format"
            defaultValue="poll"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="poll">Poll (default — options + votes)</option>
            <option value="deep_answer">Deep answer (only for genuinely nuanced questions)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Topic</span>
          <input
            name="topic"
            placeholder="e.g. schools, tax, housing, food"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--color-ink)]">
            Options (at least 2 — only used for Poll format)
          </span>
          {[1, 2, 3, 4, 5].map((i) => (
            <input
              key={i}
              name={`option_${i}`}
              placeholder={`Option ${i}`}
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          ))}
        </div>

        <GroupTagFields groups={groups} />

        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Post question
        </button>
      </form>
    </main>
  );
}
