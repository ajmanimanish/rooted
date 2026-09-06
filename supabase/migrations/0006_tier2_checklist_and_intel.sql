-- Personal onboarding checklist: items are a fixed template (defined in
-- app code), this table only tracks which ones each user has checked off.
create table if not exists checklist_progress (
  profile_id uuid references profiles(id) on delete cascade,
  item_key text not null,
  completed_at timestamptz default now(),
  primary key (profile_id, item_key)
);

alter table checklist_progress enable row level security;

drop policy if exists "checklist_select_own" on checklist_progress;
create policy "checklist_select_own" on checklist_progress
  for select using (auth.uid() = profile_id);
drop policy if exists "checklist_insert_own" on checklist_progress;
create policy "checklist_insert_own" on checklist_progress
  for insert with check (auth.uid() = profile_id);
drop policy if exists "checklist_delete_own" on checklist_progress;
create policy "checklist_delete_own" on checklist_progress
  for delete using (auth.uid() = profile_id);

-- "Right now" crowd-fed local intel: short, freshness-stamped facts
-- (Bürgeramt wait times, price checks, provider availability) — lighter
-- weight than a full Knowledge poll or Resource listing.
create table if not exists intel_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  label text not null,
  value text not null,
  author_id uuid references profiles(id),
  created_at timestamptz default now()
);

alter table intel_items enable row level security;

drop policy if exists "intel_select_all" on intel_items;
create policy "intel_select_all" on intel_items for select using (true);
drop policy if exists "intel_insert_authenticated" on intel_items;
create policy "intel_insert_authenticated" on intel_items
  for insert with check (auth.uid() = author_id);
