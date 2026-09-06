"use client";

import { useState } from "react";
import { sendRelayMessage } from "@/app/relay/actions";

// A basic "message the poster" inquiry — unlike AskVoterButton, this isn't
// gated by vouch-range; anyone signed in can ask about a listing.
export default function MessagePosterButton({
  toId,
  contextType,
  contextId,
  returnTo,
}: {
  toId: string;
  contextType: string;
  contextId: string;
  returnTo: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)]"
      >
        Message
      </button>
    );
  }

  return (
    <form action={sendRelayMessage} onSubmit={() => setOpen(false)} className="flex items-center gap-2">
      <input type="hidden" name="to_id" value={toId} />
      <input type="hidden" name="context_type" value={contextType} />
      <input type="hidden" name="context_id" value={contextId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <input
        name="message"
        autoFocus
        required
        maxLength={300}
        placeholder="Ask about this…"
        className="flex-1 rounded-lg border border-[var(--color-neutral-border)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)]"
      >
        Send
      </button>
    </form>
  );
}
