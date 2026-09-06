"use client";

import { useTransition } from "react";
import { setStage } from "@/app/actions";

const STAGES = [
  { value: "just_arrived", label: "Just arrived" },
  { value: "settling_in", label: "Settling in" },
  { value: "long_term", label: "Long-term" },
];

export default function StageSelector({ current }: { current: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-[var(--color-neutral)]">Your stage</span>
      <div className="inline-flex rounded-full border border-[var(--color-neutral-border)] p-0.5 text-sm">
        {STAGES.map((s) => (
          <button
            key={s.value}
            disabled={isPending}
            onClick={() => {
              const formData = new FormData();
              formData.set("stage", s.value);
              startTransition(() => {
                setStage(formData);
              });
            }}
            className={
              current === s.value
                ? "rounded-full bg-[var(--color-primary)] px-3 py-1 text-white"
                : "rounded-full px-3 py-1 text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
            }
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
