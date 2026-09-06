import { createClient } from "@/lib/supabase/server";
import { requireUser, fetchUserGroups } from "@/lib/auth";
import GroupTagFields from "@/components/GroupTagFields";
import { createResource } from "@/app/resources/actions";

export default async function NewResourcePage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const groups = await fetchUserGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Add a resource</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        A vetted provider — handyman, cleaner, tax adviser, doctor, anything people ask about.
      </p>

      <form action={createResource} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Category</span>
          <input
            name="category"
            required
            placeholder="e.g. tax_adviser, doctor, handyman"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Name</span>
          <input
            name="name"
            required
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Contact note</span>
          <textarea
            name="contact_note"
            rows={2}
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <GroupTagFields groups={groups} />

        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Add resource
        </button>
      </form>
    </main>
  );
}
