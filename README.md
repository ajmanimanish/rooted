# Rooted

A trust-gated community platform for newcomers and expats settling into a new city (seeded with demo data for Düsseldorf). The idea: generic listing sites don't tell you who's actually reliable — Rooted tries to fix that with a real vouching system instead of star ratings.

## What it does

Members join topic, nationality, or profession-based **Groups**, which act as a filter over six shared content pillars:

- **Housing**, including "handover" listings where a departing member bundles their trusted plumber/doctor/tax-adviser contacts for the next tenant
- **Knowledge**, a poll-style Q&A for local tips
- **Resources**, a vetted-provider directory
- **Marketplace** and **Events**
- **Arrival Help** — offering to meet a traveler in person, gated to verified members with at least 2 vouches

A vouch graph computes trust paths between members (e.g. *You → Maria → Priya*) and ranks Arrival Help offers by social proximity rather than just recency. Browsing is open to anyone; voting, tipping, vouching, and offering help require an account.

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript, Tailwind CSS 4
- Supabase: Postgres, Auth (email magic-link, standing in for a planned LinkedIn OAuth), Storage, Row Level Security

## Running it locally

```bash
npm install
npm run dev
```

You'll need a Supabase project with the migrations in `supabase/migrations/` applied, and `.env.local` populated with:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (server-only)

Optionally seed demo data with `npm run seed:demo`.

## The interesting part

The Arrival Help trust gate (verified account + 2+ vouches) isn't just checked in the UI — it's enforced inside the database itself, via a Postgres `security definer` function used in a Row Level Security policy. That means the highest-trust action in the app can't be bypassed by calling the Supabase API directly instead of going through the app; the database itself refuses the write. It's a small piece of defense-in-depth that's easy to skip on a personal project and easy to get wrong even when you do it.

## Status

Feature-complete against its own build plan (all six pillars, the vouch/trust system, and demo seeding all work), but it's an MVP, not a hardened product: there's no automated test suite, auth is explicitly a placeholder for real OAuth, and the vouch-graph query currently fetches the entire edge table client-side — commented in the code as "fine at MVP scale, revisit if it grows." Built as a focused, AI-assisted two-day build against a written spec (`reference/rooted_build_plan.md`) rather than iterated over months.
