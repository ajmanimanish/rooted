"use client";

import { useState } from "react";
import { sendRelayMessage } from "@/app/relay/actions";

// The ask-a-voter relay: a CTA on a top-ranked card to send one short
// message to a voter within the current user's vouch range.
export default function AskVoterButton({
  toId,
  toName,
  contextType,
  contextId,
  returnTo,
}: {
  toId: string;
  toName: string;
  contextType: string;
  contextId: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-[var(--color-neutral-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary-deep)] hover:border-[var(--color-primary)]"
      >
        Ask {toName}
      </button>
    );
  }

  return (
    <form
      action={sendRelayMessage}
      onSubmit={() => setOpen(false)}
      className="mt-1 flex items-center gap-2"
    >
      <input type="hidden" name="to_id" value={toId} />
      <input type="hidden" name="context_type" value={contextType} />
      <input type="hidden" name="context_id" value={contextId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input
        name="message"
        autoFocus
        required
        maxLength={300}
        placeholder={`Ask ${toName} something…`}
        className="flex-1 rounded-lg border border-[var(--color-neutral-border)] px-3 py-1 text-sm outline-none focus:border-[var(--color-primary)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--color-primary)] px-3 py-1 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
      >
        Send
      </button>
    </form>
  );
}
