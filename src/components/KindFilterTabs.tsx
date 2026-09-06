"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function KindFilterTabs({
  options,
  paramName = "kind",
}: {
  options: { value: string; label: string }[];
  paramName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramName) ?? "all";

  return (
    <div className="inline-flex flex-wrap gap-1 rounded-full border border-[var(--color-neutral-border)] p-0.5 text-sm">
      {options.map((opt) => {
        const params = new URLSearchParams(searchParams.toString());
        if (opt.value === "all") params.delete(paramName);
        else params.set(paramName, opt.value);
        const href = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        const isActive = current === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => router.push(href)}
            className={
              isActive
                ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
                : "rounded-full px-3 py-1 text-[var(--color-neutral)]"
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
