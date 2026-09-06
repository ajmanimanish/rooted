-- ROOTED — Supabase schema draft (v1)
-- Derived from the Rooted_-_Standalone4.html prototype's data shapes.
-- Uses Supabase auth.users as the identity root; RLS policies sketched, not exhaustive.

-- ══════════════════════════════════════════════
-- CORE IDENTITY & TRUST
-- ══════════════════════════════════════════════

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  initials text,
  avatar_url text,                          -- generated avatar (DiceBear-style) or uploaded photo
  origin_country text,
  origin_region text,                       -- rollup: South Asia, EU, LatAm, etc.
  city text not null default 'Düsseldorf',
  state text,
  neighborhood text,                        -- stored only as a profile detail, never an organizing axis
  employer text,                            -- stored only as a profile detail, never an organizing axis
  role text,
  languages text[],                         -- for arrival-help matching
  stage text check (stage in ('just_arrived','settling_in','long_term')) not null default 'just_arrived',
  years_in_city numeric,
  linkedin_verified boolean default false,
  employer_verified boolean default false,
  verified_local boolean default false,
  created_at timestamptz default now()
);

-- Invite/vouch graph — powers the trust path list ("You → Maria → Priya")
create table if not exists vouches (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid references profiles(id) on delete cascade,
  vouchee_id uuid references profiles(id) on delete cascade,
  invited boolean default false,            -- true if voucher originally invited vouchee
  created_at timestamptz default now(),
  unique (voucher_id, vouchee_id)
);

-- ══════════════════════════════════════════════
-- GROUPS (the lens layer)
-- ══════════════════════════════════════════════

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  axis text check (axis in ('nationality','situation','interest','profession','topic')) not null,
  city text default 'Düsseldorf',
  description text,
  cover_style jsonb,                        -- gradient/illustration params, offline-safe
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists group_members (
  group_id uuid references groups(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role text check (role in ('owner','member')) default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, profile_id)
);

-- ══════════════════════════════════════════════
-- SHARED TAGGING / VISIBILITY (used by every commons item below)
-- One item can be tagged to multiple groups; visibility controls where it surfaces.
-- ══════════════════════════════════════════════
-- visibility: 'general' (city-wide), 'tagged' (city-wide + pinned in tagged groups),
--             'group_only' (only within tagged groups)

create table if not exists item_group_tags (
  item_type text not null,                  -- 'listing' | 'question' | 'resource' | 'event' | 'arrival_help'
  item_id uuid not null,
  group_id uuid references groups(id) on delete cascade,
  primary key (item_type, item_id, group_id)
);

-- ══════════════════════════════════════════════
-- HOUSING (first-class pillar; includes handover)
-- ══════════════════════════════════════════════

create table if not exists housing_listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  kind text check (kind in ('available','seeking','handover')) not null,
  title text not null,
  neighborhood text,
  price numeric,
  currency text default 'EUR',
  description text,
  handover_knowledge jsonb,                 -- {plumber, tax_adviser, doctor, landlord_contact, tips[]}
  photos text[],                            -- storage URLs (Supabase Storage) or inline data for demo
  visibility text check (visibility in ('general','tagged','group_only')) default 'general',
  status text check (status in ('open','pending','closed')) default 'open',
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════
-- KNOWLEDGE (vote + poll + tip engine, plus rare deep answers)
-- ══════════════════════════════════════════════

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id),
  title text not null,
  topic text,                               -- schools, tax, housing, food, travel, etc.
  format text check (format in ('poll','deep_answer')) default 'poll',
  visibility text check (visibility in ('general','tagged','group_only')) default 'general',
  created_at timestamptz default now()
);

create table if not exists question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  label text not null,                      -- e.g. a school name, a café name
  created_at timestamptz default now()
);

create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  option_id uuid references question_options(id) on delete cascade,
  voter_id uuid references profiles(id) on delete cascade,
  tip text check (char_length(tip) <= 180),
  created_at timestamptz default now(),
  unique (option_id, voter_id)
);

create table if not exists deep_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade,
  author_id uuid references profiles(id),
  body text not null,
  helpful_count int default 0,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════
-- RESOURCES (vetted provider directory — same vote/tip engine)
-- ══════════════════════════════════════════════

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  category text not null,                   -- handyman, cleaner, tax_adviser, doctor, etc.
  name text not null,
  contact_note text,
  visibility text check (visibility in ('general','tagged','group_only')) default 'general',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists resource_votes (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid references resources(id) on delete cascade,
  voter_id uuid references profiles(id) on delete cascade,
  tip text check (char_length(tip) <= 180),
  created_at timestamptz default now(),
  unique (resource_id, voter_id)
);
-- Freshness signal: derive "Last tipped: Aug 2026" from max(created_at) per resource — no decay logic needed.

-- ══════════════════════════════════════════════
-- MARKETPLACE
-- ══════════════════════════════════════════════

create table if not exists marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references profiles(id),
  title text not null,
  price numeric,
  currency text default 'EUR',
  description text,
  photos text[],
  visibility text check (visibility in ('general','tagged','group_only')) default 'general',
  status text check (status in ('available','sold')) default 'available',
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════
-- EVENTS
-- ══════════════════════════════════════════════

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid references profiles(id),
  group_id uuid references groups(id),      -- primary hosting group, if any
  title text not null,
  starts_at timestamptz,
  location text,
  cover_photo text,
  visibility text check (visibility in ('general','tagged','group_only')) default 'general',
  created_at timestamptz default now()
);

-- "Past events" is just: select * from events where starts_at < now();
-- (no stored column needed — Postgres won't allow now() in a generated column)

create table if not exists event_photos (                 -- past-event social proof
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  photo_url text not null,
  uploaded_by uuid references profiles(id)
);

create table if not exists rsvps (
  event_id uuid references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (event_id, profile_id)
);

-- ══════════════════════════════════════════════
-- ARRIVAL HELP / TRAVEL COMPANION (highest trust floor)
-- ══════════════════════════════════════════════

create table if not exists arrival_help_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid references profiles(id),
  traveler_note text not null,              -- "My mother, 68, flying alone from Mumbai..."
  languages_needed text[] not null,
  arrival_window timestamptz not null,
  flight_info text,
  status text check (status in ('open','offered','confirmed','done','cancelled')) default 'open',
  created_at timestamptz default now()
);

create table if not exists arrival_help_offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references arrival_help_requests(id) on delete cascade,
  helper_id uuid references profiles(id),
  -- REQUIRES helper.employer_verified/linkedin_verified AND >=2 vouches — enforce in app layer + RLS
  confirmed boolean default false,
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════
-- ASK-A-VOTER RELAY (ties into vouch graph)
-- ══════════════════════════════════════════════

create table if not exists voter_relay_messages (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id),
  to_id uuid references profiles(id),
  context_type text,                        -- 'question_option' | 'resource'
  context_id uuid,
  message text check (char_length(message) <= 300),
  created_at timestamptz default now()
);

-- ══════════════════════════════════════════════
-- NOTES FOR RLS (Row Level Security) — implement in Supabase dashboard/policies:
-- • Read-only browse: anonymous/authenticated users can SELECT general-visibility rows freely.
-- • group_only rows: SELECT only if auth.uid() is in group_members for that group_id (via item_group_tags join).
-- • High-trust actions (INSERT on votes, resource_votes, arrival_help_offers, vouches):
--     require the profile to meet the relevant verification flags.
-- • arrival_help_offers: additionally require >=2 vouches for the helper (check in a Postgres function).
-- ══════════════════════════════════════════════
