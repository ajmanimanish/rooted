# Rooted — Build Plan for Claude Code (Next.js + Supabase + Vercel)

Source of truth: `Rooted_-_Standalone4.html` (the working prototype).
This plan ports its IA and interaction logic into a real, deployable app.
Give this file + the prototype HTML + `rooted_schema.sql` to Claude Code as
the starting brief.

## Stack
- Next.js (App Router) + React
- Supabase: Postgres (see rooted_schema.sql), Auth, Storage (photos), Row Level Security
- Vercel for hosting/deploy
- Tailwind CSS (matches the "fresh" palette already chosen: base #F6F8F7,
  surfaces #FFFFFF, primary teal #10A19A, deep #0B6E6A, coral accent #FF7A59,
  ink #17262B, neutrals #64757B/#AEBAC0/#E6ECEA)

## Phase 1 — Scaffold
1. `create-next-app` with Tailwind, App Router.
2. Connect Supabase project; run `rooted_schema.sql`.
3. Auth: Supabase Auth with LinkedIn OAuth (or email as a stand-in until
   LinkedIn OAuth app is approved) for the verification flow. Read-only
   browsing must work WITHOUT login — gate only high-trust actions
   (vote, tip, ask, vouch, arrival-help offer, apply for handover).

## Phase 2 — Core layout
- Top nav: Groups · Housing · Knowledge · Resources · Marketplace · Events
  (matches prototype). "Verify me" CTA persistent until verified.
- Home = personalized feed: user's Groups + activity, current-stage
  relevant items, warm welcome copy — NOT a search-bar or ask-box hero.
- Global "+" affordances: Start a group / Ask a question / Post an event /
  List something / "Someone landing alone? Ask for arrival help."

## Phase 3 — Groups (build this fully, it's the model's linchpin)
- Group list/detail pages; create-group flow (name + axis: nationality /
  situation / interest / profession / topic).
- **Group activity feed**: aggregates all item types (housing, knowledge,
  resources, marketplace, events, arrival-help) tagged to that group via
  `item_group_tags`, newest first, each attributed to the member who posted it.
- **"Trusted by this group" filter**: a toggle on Housing/Knowledge/Resources
  list views that filters the same global data down to items tagged with
  groups the current user belongs to. Reuse one query pattern across all three.
- Build and manually verify the two-seat walkthrough before considering this
  phase done: seed one demo group with 2–3 members and a few posted items,
  then check (a) the poster's own view right after posting and (b) a second
  member's view of that same item in their feed. This is the concrete test
  of whether the lens model feels cohesive — don't skip it.

## Phase 4 — Item creation with tagging (shared component)
- One reusable "create item" flow (used by Housing, Knowledge, Resources,
  Marketplace, Events) that includes:
  - the type-specific fields
  - multi-select group tagging
  - visibility choice: General / Tagged groups / Group-only
  - photo upload (Supabase Storage) where relevant (Housing, Marketplace, Events)
- Server-side: writes to the type table + `item_group_tags` rows.

## Phase 5 — Pillars
- **Housing**: available / seeking / handover listing types; handover
  includes bundled knowledge (plumber, tax adviser, doctor, tips) — this is
  the differentiator, give it real design attention. Photo gallery on cards.
- **Knowledge**: question creation defaults to poll format (options + vote +
  optional ≤180-char tip); reserve free-text "deep answer" format for
  clearly nuanced questions only. Peer-weighted badges ("#1 for families",
  "top pick in [group]") computed from vote counts grouped by voter's groups.
- **Resources**: same vote/tip engine as Knowledge, scoped to provider
  categories. Show "Last tipped: [date]" freshness badge (derived from
  max(created_at), no decay algorithm).
- **Marketplace**: simple listings, photos, sold/available status.
- **Events**: create with cover photo, RSVP, and a **Past events** section
  per group/city rendering `event_photos` as social proof.

## Phase 6 — Trust layer
- Profile page: verification badges, vouch chain.
- Trust graph: default to **Path List view** ("You → Maria → Priya"),
  segmented toggle to an optional interactive canvas view. Path list is the
  primary/mobile experience.
- **Ask-a-voter relay**: on a top-ranked Knowledge/Resource card, a CTA to
  send one short message to a voter within the user's vouch range
  (`voter_relay_messages`).

## Phase 7 — Arrival Help / Travel Companion (highest trust floor)
- Create-request flow: traveler note, languages needed, arrival window,
  flight info. Surfaced from Groups (esp. nationality/language groups) and
  a home "I need help" action — not a standalone permanent tab.
- Home page section renamed away from any "nearby" framing (not a proximity
  feature) — e.g. "Arrival help needed."
- Matching + display: rank/highlight potential helpers who share a group or
  have vouch-proximity with the requester ABOVE unconnected verified strangers.
- Gate offering help behind the highest verification tier: verified identity
  + ≥2 vouches (enforce via a Postgres function + RLS, not just UI).
- Non-monetary by design — no payment fields anywhere in this flow.
- Show verification/vouch cues directly on both the request card and the
  offer flow.

## Phase 8 — Never-empty / cold-start handling
- For any ranked list (Knowledge votes, Resources) with too few entries:
  auto-widen the query (e.g. neighborhood → city) and show a banner
  explaining the widening, with the dropped filter chip visually
  dimmed/struck — OR show a warm "Be the first — add a spot" prompt.
  Never render a bare, sparse list with no explanation.

## Phase 9 — Demo data & seeding
- Port `rooted_demo_data.json` / `rooted-data.js` into a Supabase seed
  script so the deployed app isn't empty on first load.
- Persistent "DEMO DATA" banner + "Demo" tag on profile cards while seeded
  data is in use — same as the prototype.

## Suggested build order for Claude Code sessions
1. Scaffold + schema + auth skeleton (Phase 1–2)
2. Groups + tagging + the two-seat feed walkthrough (Phase 3–4) — validate
   this before going further, it's the riskiest part of the model
3. Housing + Knowledge + Resources (Phase 5, these are the "deep" pillars)
4. Marketplace + Events (Phase 5 cont.)
5. Trust layer + Ask-a-voter (Phase 6)
6. Arrival Help (Phase 7)
7. Cold-start handling + seed data + polish (Phase 8–9)
