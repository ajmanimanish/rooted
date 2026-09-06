"use client";

import { useState } from "react";

export default function AxisSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <section className="mt-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-light)]">
          {title} <span className="text-[var(--color-neutral)]">· {count} groups</span>
        </h2>
        <span className="text-[var(--color-neutral-light)]">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="mt-3 grid gap-2 sm:grid-cols-2">{children}</div>}
    </section>
  );
}
