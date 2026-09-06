"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="How Rooted works"
        className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-neutral)] hover:bg-[var(--color-base)] hover:text-[var(--color-ink)]"
      >
        ?
      </button>

      {open && (
        <Modal onClose={() => setOpen(false)} maxWidth="max-w-md">
          <h2 className="font-serif text-xl text-[var(--color-ink)]">How Rooted works</h2>
          <dl className="mt-4 flex flex-col gap-4 text-sm">
            <div>
              <dt className="font-medium text-[var(--color-ink)]">Groups are the lens</dt>
              <dd className="mt-0.5 text-[var(--color-neutral)]">
                Everything you see can be filtered to just your groups — by nationality, life
                situation, interest, or profession. Never by employer or street.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-ink)]">Reading is free, contributing is verified</dt>
              <dd className="mt-0.5 text-[var(--color-neutral)]">
                Browse everything without an account. Sign in to vote, tip, ask, or vouch — those
                actions carry your name.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-ink)]">Vouches build a trust graph</dt>
              <dd className="mt-0.5 text-[var(--color-neutral)]">
                Vouching for someone links you to them. The highest-trust actions — like offering
                arrival help — require verified identity plus at least two vouches.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-[var(--color-ink)]">Handovers are gated</dt>
              <dd className="mt-0.5 text-[var(--color-neutral)]">
                Full handover details (the departing member&apos;s plumber, tax adviser, doctor)
                only unlock for verified members.
              </dd>
            </div>
          </dl>
          <button
            onClick={() => setOpen(false)}
            className="mt-5 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
          >
            Got it
          </button>
        </Modal>
      )}
    </>
  );
}
