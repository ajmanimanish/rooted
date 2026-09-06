"use client";

import { useState } from "react";
import Link from "next/link";

// Contextual modal, not a standalone page — matches the prototype's pattern
// of surfacing verification exactly when it's relevant, not as a dead-end page.
export default function VerifyMeButton({ isSignedIn }: { isSignedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        Verify me
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 shadow-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
              Only for this bit
            </p>
            <h2 className="mt-1 font-serif text-xl text-[var(--color-ink)]">Verify to join in</h2>
            <p className="mt-2 text-sm text-[var(--color-neutral)]">
              Reading is open to everyone. Verification kicks in when your name goes next to
              something — so a vote here means what it says.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              {!isSignedIn ? (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
                >
                  Sign in to get started
                </Link>
              ) : (
                <>
                  <button
                    disabled
                    title="Work-email domain verification isn't live yet"
                    className="cursor-not-allowed rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-light)]"
                  >
                    Verify with work email — coming soon
                  </button>
                  <button
                    disabled
                    title="LinkedIn verification is pending OAuth app approval"
                    className="cursor-not-allowed rounded-lg border border-[var(--color-neutral-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-light)]"
                  >
                    Verify with LinkedIn — coming soon
                  </button>
                </>
              )}
              <button
                onClick={() => setOpen(false)}
                className="mt-1 text-sm text-[var(--color-neutral)] hover:text-[var(--color-ink)]"
              >
                Keep browsing without it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
