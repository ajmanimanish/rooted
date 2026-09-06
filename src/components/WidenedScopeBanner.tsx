export default function WidenedScopeBanner({ count }: { count: number }) {
  return (
    <div className="mb-4 rounded-lg bg-[var(--color-accent)]/10 px-4 py-2.5 text-sm text-[var(--color-ink)]">
      Only {count} {count === 1 ? "post" : "posts"} from your groups so far — widened to show everyone instead.
    </div>
  );
}
