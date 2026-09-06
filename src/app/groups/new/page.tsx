import { createGroup } from "@/app/groups/actions";

const AXES = [
  { value: "nationality", label: "Nationality" },
  { value: "situation", label: "Situation" },
  { value: "interest", label: "Interest" },
  { value: "profession", label: "Profession" },
  { value: "topic", label: "Topic" },
];

export default function NewGroupPage() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-10">
      <h1 className="font-serif text-2xl text-[var(--color-ink)]">Start a group</h1>
      <p className="mt-1 text-sm text-[var(--color-neutral)]">
        Groups are the lens people use to find what&apos;s relevant to them.
      </p>

      <form action={createGroup} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Name</span>
          <input
            name="name"
            required
            placeholder="e.g. Indians in Düsseldorf"
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Axis</span>
          <select
            name="axis"
            required
            defaultValue=""
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="" disabled>
              Choose one
            </option>
            {AXES.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-[var(--color-ink)]">Description (optional)</span>
          <textarea
            name="description"
            rows={3}
            className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
        >
          Create group
        </button>
      </form>
    </main>
  );
}
