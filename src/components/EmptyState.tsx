import Link from "next/link";

// Phase 8 pattern: never render a bare, sparse list with no explanation.
export default function EmptyState({
  message,
  ctaHref,
  ctaLabel,
}: {
  message: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--color-neutral-border)] p-8 text-center">
      <p className="text-sm text-[var(--color-neutral)]">{message}</p>
      {ctaHref && ctaLabel && (
        <Link href={ctaHref} className="mt-3 inline-block text-sm font-medium text-[var(--color-primary-deep)]">
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
