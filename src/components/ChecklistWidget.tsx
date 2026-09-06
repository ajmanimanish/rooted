"use client";

import { useState } from "react";
import { CHECKLIST_TEMPLATE } from "@/lib/checklist";
import { toggleChecklistItem } from "@/app/checklist/actions";

export default function ChecklistWidget({ completedKeys }: { completedKeys: string[] }) {
  const completed = new Set(completedKeys);
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-neutral)]">Your checklist</h2>
      <div className="mt-2 flex flex-col gap-2">
        {CHECKLIST_TEMPLATE.map((category) => {
          const done = category.items.filter((i) => completed.has(i.key)).length;
          const isOpen = openKey === category.key;
          return (
            <div key={category.key} className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)]">
              <button
                onClick={() => setOpenKey(isOpen ? null : category.key)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-[var(--color-ink)]">{category.label}</span>
                <span className="flex items-center gap-2 text-sm text-[var(--color-neutral)]">
                  {done}/{category.items.length}
                  <span className="text-[var(--color-neutral-light)]">{isOpen ? "▲" : "▼"}</span>
                </span>
              </button>
              {isOpen && (
                <ul className="flex flex-col gap-1 border-t border-[var(--color-neutral-border)] px-4 py-3">
                  {category.items.map((item) => {
                    const isDone = completed.has(item.key);
                    return (
                      <li key={item.key}>
                        <form action={toggleChecklistItem} className="flex items-center gap-2">
                          <input type="hidden" name="item_key" value={item.key} />
                          <input type="hidden" name="is_done" value={String(isDone)} />
                          <button
                            type="submit"
                            className="flex items-center gap-2 py-1 text-sm text-left"
                          >
                            <span
                              className={
                                isDone
                                  ? "flex h-4 w-4 items-center justify-center rounded border border-[var(--color-primary)] bg-[var(--color-primary)] text-[10px] text-white"
                                  : "h-4 w-4 rounded border border-[var(--color-neutral-border)]"
                              }
                            >
                              {isDone && "✓"}
                            </span>
                            <span className={isDone ? "text-[var(--color-neutral-light)] line-through" : "text-[var(--color-ink)]"}>
                              {item.label}
                            </span>
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
