"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Email magic-link sign-in — the stand-in for LinkedIn OAuth until that
// OAuth app is approved (see build plan, Phase 1). Swap the provider here
// once LinkedIn is live; the rest of the auth flow (callback, session) holds.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-2xl text-[var(--color-ink)]">Welcome to Rooted</h1>
        <p className="mt-2 text-sm text-[var(--color-neutral)]">
          Browsing is open to everyone. Sign in to vote, tip, ask, vouch, or offer arrival help.
        </p>

        {status === "sent" ? (
          <p className="mt-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-neutral-border)] p-4 text-sm text-[var(--color-ink)]">
            Check <strong>{email}</strong> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-[var(--color-neutral-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-primary-deep)] disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
            {status === "error" && (
              <p className="text-sm text-red-600">Something went wrong — try again.</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
