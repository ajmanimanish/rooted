import { createClient } from "@/lib/supabase/server";
import { requireUser, fetchUserGroups } from "@/lib/auth";
import GroupTagFields from "@/components/GroupTagFields";
import { createMarketplaceListing } from "@/app/marketplace/actions";

export default async function NewMarketplaceListingPage() {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const groups = await fetchUserGroups(supabase, user.id);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">List something</h1>

      <form action={createMarketplaceListing} encType="multipart/form-data" className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Title</span>
          <input
            name="title"
            required
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Price (EUR)</span>
          <input
            name="price"
            type="number"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

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
