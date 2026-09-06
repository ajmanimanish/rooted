"use client";

import { useState } from "react";
import { postIntel } from "@/app/intel/actions";
import { relativeTime } from "@/lib/relativeTime";

type IntelItem = { id: string; category: string; label: string; value: string; created_at: string };

export default function IntelTicker({ items }: { items: IntelItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">
          Right now <span className="ml-1 text-xs font-normal normal-case text-[var(--color-neutral-light)]">crowd-fed</span>
        </h2>
        <button onClick={() => setOpen((v) => !v)} className="text-sm font-medium text-[var(--color-primary-deep)]">
          {open ? "Cancel" : "+ Add a data point"}
        </button>
      </div>

      {open && (
        <form
          action={async (fd) => {
            await postIntel(fd);
            setOpen(false);
          }}
          className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] p-3"
        >
          <input
            name="category"
            required
            placeholder="Category (e.g. Bürgeramt)"
            className="w-40 rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            name="label"
            required
            placeholder="What's the update?"
            className="flex-1 min-w-[10rem] rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <input
            name="value"
            required
            placeholder="Current value"
            className="w-36 rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <button type="submit" className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]">
            Post
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-neutral-light)]">
          No local intel yet — add the first data point.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5">
              <p className="text-xs uppercase tracking-wide text-[var(--color-neutral-light)]">{item.category}</p>
              <p className="text-sm text-[var(--color-ink)]">
                {item.label} — <span className="font-medium">{item.value}</span>
              </p>
              <p className="text-xs text-[var(--color-neutral-light)]">{relativeTime(item.created_at)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
