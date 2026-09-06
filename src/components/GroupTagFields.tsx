type Group = { id: string; name: string };

// Shared across every "create item" flow (Housing, Knowledge, Resources,
// Marketplace, Events) — same field names, same server-side handling via
// readGroupIds/readVisibility in lib/items.ts.
export default function GroupTagFields({
  groups,
  showVisibility = true,
}: {
  groups: Group[];
  showVisibility?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-neutral-border)] p-4">
      {showVisibility && (
        <div>
          <span className="text-sm font-medium text-[var(--color-ink)]">Visibility</span>
          <div className="mt-1 flex flex-col gap-1 text-sm text-[var(--color-neutral)]">
            <label className="flex items-center gap-2">
              <input type="radio" name="visibility" value="general" defaultChecked />
              General — visible city-wide
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="visibility" value="tagged" />
              Tagged groups — city-wide, pinned in the groups below
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="visibility" value="group_only" />
              Group-only — only visible within the groups below
            </label>
          </div>
        </div>
      )}

      {groups.length > 0 ? (
        <div>
          <span className="text-sm font-medium text-[var(--color-ink)]">Tag to groups</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {groups.map((g) => (
              <label
                key={g.id}
                className="flex items-center gap-1.5 rounded-full border border-[var(--color-neutral-border)] px-3 py-1 text-sm text-[var(--color-ink)] has-checked:border-[var(--color-primary)] has-checked:bg-[var(--color-base)]"
              >
                <input type="checkbox" name="group_ids" value={g.id} className="accent-[var(--color-primary)]" />
                {g.name}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-neutral)]">
          You&apos;re not in any groups yet, so this will only be visible city-wide.
        </p>
      )}
    </div>
  );
}
