import { createClient } from "@/lib/supabase/server";
import { requireUser, fetchUserGroups } from "@/lib/auth";
import GroupTagFields from "@/components/GroupTagFields";
import { createArrivalHelpRequest } from "@/app/arrival-help/actions";

export default async function NewArrivalHelpPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const groups = await fetchUserGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Ask for arrival help</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Non-monetary — someone offers company and help at the airport or on arrival, nothing more.
        Tag your nationality or language group so the right people see it.
      </p>

      <form action={createArrivalHelpRequest} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Traveler note</span>
          <textarea
            name="traveler_note"
            required
            rows={3}
            placeholder="e.g. My mother, 68, flying alone from Mumbai, doesn't speak German or English."
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Languages needed</span>
          <input
            name="languages_needed"
            required
            placeholder="e.g. Hindi, Marathi"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <span className="text-xs text-[var(--color-neutral-light)]">Comma-separated</span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-ink)]">Arrival window</span>
            <input
              name="arrival_window"
              type="datetime-local"
              required
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-ink)]">Flight info</span>
            <input
              name="flight_info"
              placeholder="e.g. LH 761"
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
        </div>

        <GroupTagFields groups={groups} showVisibility={false} />

        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Post request
        </button>
      </form>
    </main>
  );
}
