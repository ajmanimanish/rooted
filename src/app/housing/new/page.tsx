import { createClient } from "@/lib/supabase/server";
import { requireUser, fetchUserGroups } from "@/lib/auth";
import GroupTagFields from "@/components/GroupTagFields";
import { createHousingListing } from "@/app/housing/actions";

export default async function NewHousingListingPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const groups = await fetchUserGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">List housing</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Available, seeking, or a handover — handovers can bundle the knowledge that comes with the place.
      </p>

      <form action={createHousingListing} encType="multipart/form-data" className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Kind</span>
          <select
            name="kind"
            required
            defaultValue=""
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="" disabled>Choose one</option>
            <option value="available">Available</option>
            <option value="seeking">Seeking</option>
            <option value="handover">Handover</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Title</span>
          <input
            name="title"
            required
            placeholder="e.g. 2BR in Flingern, available Dec 1"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-ink)]">Neighborhood</span>
            <input
              name="neighborhood"
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-[var(--color-ink)]">Price (EUR/mo)</span>
            <input
              name="price"
              type="number"
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Description</span>
          <textarea
            name="description"
            rows={3}
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Photos</span>
          <input
            type="file"
            name="photos"
            multiple
            accept="image/*"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-base)] file:px-3 file:py-1.5 file:text-sm"
          />
        </label>

        <fieldset className="flex flex-col gap-3 rounded-lg border border-[var(--color-neutral-border)] p-4">
          <legend className="px-1 text-sm font-medium text-[var(--color-ink)]">
            Handover knowledge (only used when kind = Handover)
          </legend>
          <input
            name="handover_plumber"
            placeholder="Plumber contact"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            name="handover_tax_adviser"
            placeholder="Tax adviser contact"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            name="handover_doctor"
            placeholder="Doctor contact"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <textarea
            name="handover_tips"
            rows={2}
            placeholder="Other tips for whoever takes over the place"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </fieldset>

        <GroupTagFields groups={groups} />

        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Post listing
        </button>
      </form>
    </main>
  );
}
