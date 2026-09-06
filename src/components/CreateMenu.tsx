"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const ACTIONS = [
  { href: "/groups/new", label: "Start a group" },
  { href: "/knowledge/new", label: "Ask a question" },
  { href: "/events/new", label: "Post an event" },
  { href: "/marketplace/new", label: "List something" },
  { href: "/arrival-help/new", label: "Someone landing alone? Ask for arrival help." },
];

export default function CreateMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Create"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-deep)]"
      >
        +
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[var(--color-neutral-border)] bg-[var(--color-surface)] py-2 shadow-lg">
          {ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-[var(--color-ink)] hover:bg-[var(--color-base)]"
            >
              {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
