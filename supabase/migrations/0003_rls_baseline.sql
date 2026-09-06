-- Baseline RLS: read-only browsing works for anonymous + authenticated users
-- on 'general' visibility content; writes require an owned row. This is
-- intentionally permissive for MVP speed — Phase 6/7 (vouch-gated writes,
-- arrival-help verification tier) tighten specific tables further.

alter table profiles enable row level security;
alter table vouches enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table item_group_tags enable row level security;
alter table housing_listings enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table votes enable row level security;
alter table deep_answers enable row level security;
alter table resources enable row level security;
alter table resource_votes enable row level security;
alter table marketplace_listings enable row level security;
alter table events enable row level security;
alter table event_photos enable row level security;
alter table rsvps enable row level security;
alter table arrival_help_requests enable row level security;
alter table arrival_help_offers enable row level security;
alter table voter_relay_messages enable row level security;

-- Shared helper: is the current user a member of a group that this item is tagged to?
create or replace function public.can_view_item(p_item_type text, p_item_id uuid, p_visibility text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    p_visibility = 'general'
    or (
      auth.uid() is not null
      and exists (
        select 1 from item_group_tags t
        join group_members m on m.group_id = t.group_id
        where t.item_type = p_item_type
          and t.item_id = p_item_id
          and m.profile_id = auth.uid()
      )
    );
$$;

-- profiles: public read (badges/trust info are meant to be visible); own-row writes
drop policy if exists "profiles_select_all" on profiles;
create policy "profiles_select_all" on profiles for select using (true);
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- vouches: the trust graph is visible to everyone; you can only vouch as yourself
drop policy if exists "vouches_select_all" on vouches;
create policy "vouches_select_all" on vouches for select using (true);
drop policy if exists "vouches_insert_own" on vouches;
create policy "vouches_insert_own" on vouches for insert with check (auth.uid() = voucher_id);

-- groups: public read; any authenticated user can create a group
drop policy if exists "groups_select_all" on groups;
create policy "groups_select_all" on groups for select using (true);
drop policy if exists "groups_insert_authenticated" on groups;
create policy "groups_insert_authenticated" on groups for insert with check (auth.uid() is not null);

-- group_members: public read (membership badges); users manage their own membership
drop policy if exists "group_members_select_all" on group_members;
create policy "group_members_select_all" on group_members for select using (true);
drop policy if exists "group_members_insert_own" on group_members;
create policy "group_members_insert_own" on group_members for insert with check (auth.uid() = profile_id);
drop policy if exists "group_members_delete_own" on group_members;
create policy "group_members_delete_own" on group_members for delete using (auth.uid() = profile_id);

-- item_group_tags: public read; app layer is trusted to only tag the tagger's own items
drop policy if exists "item_group_tags_select_all" on item_group_tags;
create policy "item_group_tags_select_all" on item_group_tags for select using (true);
drop policy if exists "item_group_tags_insert_authenticated" on item_group_tags;
create policy "item_group_tags_insert_authenticated" on item_group_tags for insert with check (auth.uid() is not null);

-- housing_listings
drop policy if exists "housing_select_visible" on housing_listings;
create policy "housing_select_visible" on housing_listings for select
  using (can_view_item('listing', id, visibility));
drop policy if exists "housing_insert_own" on housing_listings;
create policy "housing_insert_own" on housing_listings for insert with check (auth.uid() = author_id);
drop policy if exists "housing_update_own" on housing_listings;
create policy "housing_update_own" on housing_listings for update using (auth.uid() = author_id);

-- questions + options + votes + deep_answers
drop policy if exists "questions_select_visible" on questions;
create policy "questions_select_visible" on questions for select
  using (can_view_item('question', id, visibility));
drop policy if exists "questions_insert_own" on questions;
create policy "questions_insert_own" on questions for insert with check (auth.uid() = author_id);

drop policy if exists "question_options_select_all" on question_options;
create policy "question_options_select_all" on question_options for select using (true);
drop policy if exists "question_options_insert_authenticated" on question_options;
create policy "question_options_insert_authenticated" on question_options for insert with check (auth.uid() is not null);

drop policy if exists "votes_select_all" on votes;
create policy "votes_select_all" on votes for select using (true);
drop policy if exists "votes_insert_own" on votes;
create policy "votes_insert_own" on votes for insert with check (auth.uid() = voter_id);

drop policy if exists "deep_answers_select_all" on deep_answers;
create policy "deep_answers_select_all" on deep_answers for select using (true);
drop policy if exists "deep_answers_insert_own" on deep_answers;
create policy "deep_answers_insert_own" on deep_answers for insert with check (auth.uid() = author_id);

-- resources + resource_votes
drop policy if exists "resources_select_visible" on resources;
create policy "resources_select_visible" on resources for select
  using (can_view_item('resource', id, visibility));
drop policy if exists "resources_insert_authenticated" on resources;
create policy "resources_insert_authenticated" on resources for insert with check (auth.uid() is not null);

drop policy if exists "resource_votes_select_all" on resource_votes;
create policy "resource_votes_select_all" on resource_votes for select using (true);
drop policy if exists "resource_votes_insert_own" on resource_votes;
create policy "resource_votes_insert_own" on resource_votes for insert with check (auth.uid() = voter_id);

-- marketplace_listings
drop policy if exists "marketplace_select_visible" on marketplace_listings;
create policy "marketplace_select_visible" on marketplace_listings for select
  using (can_view_item('listing', id, visibility));
drop policy if exists "marketplace_insert_own" on marketplace_listings;
create policy "marketplace_insert_own" on marketplace_listings for insert with check (auth.uid() = seller_id);
drop policy if exists "marketplace_update_own" on marketplace_listings;
create policy "marketplace_update_own" on marketplace_listings for update using (auth.uid() = seller_id);

-- events + event_photos + rsvps
drop policy if exists "events_select_visible" on events;
create policy "events_select_visible" on events for select
  using (can_view_item('event', id, visibility));
drop policy if exists "events_insert_own" on events;
create policy "events_insert_own" on events for insert with check (auth.uid() = organizer_id);

drop policy if exists "event_photos_select_all" on event_photos;
create policy "event_photos_select_all" on event_photos for select using (true);
drop policy if exists "event_photos_insert_authenticated" on event_photos;
create policy "event_photos_insert_authenticated" on event_photos for insert with check (auth.uid() is not null);

drop policy if exists "rsvps_select_all" on rsvps;
create policy "rsvps_select_all" on rsvps for select using (true);
drop policy if exists "rsvps_insert_own" on rsvps;
create policy "rsvps_insert_own" on rsvps for insert with check (auth.uid() = profile_id);
drop policy if exists "rsvps_delete_own" on rsvps;
create policy "rsvps_delete_own" on rsvps for delete using (auth.uid() = profile_id);

-- arrival_help_requests: visible to all; only the requester can create their own request
drop policy if exists "arrival_requests_select_all" on arrival_help_requests;
create policy "arrival_requests_select_all" on arrival_help_requests for select using (true);
drop policy if exists "arrival_requests_insert_own" on arrival_help_requests;
create policy "arrival_requests_insert_own" on arrival_help_requests for insert with check (auth.uid() = requester_id);

-- arrival_help_offers: visible to all; INSERT gating (verification + >=2 vouches) lands in Phase 7
drop policy if exists "arrival_offers_select_all" on arrival_help_offers;
create policy "arrival_offers_select_all" on arrival_help_offers for select using (true);
drop policy if exists "arrival_offers_insert_authenticated" on arrival_help_offers;
create policy "arrival_offers_insert_authenticated" on arrival_help_offers for insert with check (auth.uid() = helper_id);

-- voter_relay_messages: only sender/recipient can read; only the sender can send
drop policy if exists "relay_select_participant" on voter_relay_messages;
create policy "relay_select_participant" on voter_relay_messages for select
  using (auth.uid() = from_id or auth.uid() = to_id);
drop policy if exists "relay_insert_own" on voter_relay_messages;
create policy "relay_insert_own" on voter_relay_messages for insert with check (auth.uid() = from_id);
