"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function SearchButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-neutral)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]"
      >
        🔍
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} maxWidth="max-w-md">
          <form action="/search" method="get" className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-[var(--color-ink)]">Search Rooted</span>
              <input
                name="q"
                autoFocus
                placeholder="Groups, housing, questions, resources…"
                className="rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
            >
              Search
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
