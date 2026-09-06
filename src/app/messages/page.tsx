import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import EmptyState from "@/components/EmptyState";

const CONTEXT_LABEL: Record<string, string> = {
  question_option: "About a Knowledge answer",
  resource: "About a Resource",
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: messages } = await supabase
    .from("voter_relay_messages")
    .select("id, message, context_type, context_id, created_at, profiles!voter_relay_messages_from_id_fkey(name)")
    .eq("to_id", user.id)
    .order("created_at", { ascending: false });

  // context_id for a question_option is the option id, not the question id —
  // resolve it so the "view" link goes to the right question.
  const optionIds = (messages ?? [])
    .filter((m) => m.context_type === "question_option" && m.context_id)
    .map((m) => m.context_id as string);

  let questionIdByOption: Record<string, string> = {};
  if (optionIds.length > 0) {
    const { data: opts } = await supabase
      .from("question_options")
      .select("id, question_id")
      .in("id", optionIds);
    questionIdByOption = Object.fromEntries((opts ?? []).map((o) => [o.id, o.question_id]));
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Messages</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        People asking you about something you voted on or endorsed.
      </p>

      <div className="mt-6">
        {!messages || messages.length === 0 ? (
          <EmptyState message="No messages yet." />
        ) : (
          <ul className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">
                  {CONTEXT_LABEL[m.context_type ?? ""] ?? "Message"}
                </p>
                <p className="mt-1 text-[var(--color-ink)]">{m.message}</p>
                <p className="mt-1 text-sm text-[var(--color-neutral)]">
                  From {(m.profiles as unknown as { name: string } | null)?.name ?? "Someone"}
                  {m.context_type === "question_option" && questionIdByOption[m.context_id ?? ""] && (
                    <> · <Link href={`/knowledge/${questionIdByOption[m.context_id as string]}`} className="text-[var(--color-primary-deep)] hover:underline">view</Link></>
                  )}
                  {m.context_type === "resource" && (
                    <> · <Link href="/resources" className="text-[var(--color-primary-deep)] hover:underline">view</Link></>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
