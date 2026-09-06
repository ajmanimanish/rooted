"use client";

import { useRouter, usePathname } from "next/navigation";

// Same toggle, same query-param convention (?trusted=1), reused by
// Housing/Knowledge/Resources list views per the build plan.
// `widened` means the caller asked for the trusted scope but the page
// auto-widened to Everyone because there weren't enough results — the
// Trusted pill renders dimmed/struck to show it was overridden, per the
// cold-start handling in the build plan.
export default function TrustedToggle({ active, widened = false }: { active: boolean; widened?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="inline-flex rounded-full border border-[var(--color-neutral-border)] p-0.5 text-sm">
      <button
        onClick={() => router.push(pathname)}
        className={
          !active
            ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
            : "rounded-full px-3 py-1 text-[var(--color-neutral)]"
        }
      >
        Everyone
      </button>
      <button
        onClick={() => router.push(`${pathname}?trusted=1`)}
        className={
          active
            ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
            : widened
              ? "rounded-full px-3 py-1 text-[var(--color-neutral-light)] line-through decoration-1"
              : "rounded-full px-3 py-1 text-[var(--color-neutral)]"
        }
      >
        Trusted by my groups
      </button>
    </div>
  );
}
