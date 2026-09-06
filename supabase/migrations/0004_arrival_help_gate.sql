-- Arrival Help is the highest-trust-floor feature: offering help requires
-- verified identity AND at least 2 vouches. Enforced here at the database
-- layer (not just hidden in the UI) so it can't be bypassed by calling the
-- API directly.

create or replace function public.can_offer_arrival_help(p_helper_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select
    exists (
      select 1 from profiles
      where id = p_helper_id
        and (linkedin_verified or employer_verified)
    )
    and (
      select count(*) from vouches where vouchee_id = p_helper_id
    ) >= 2;
$$;

drop policy if exists "arrival_offers_insert_authenticated" on arrival_help_offers;
create policy "arrival_offers_insert_verified" on arrival_help_offers
  for insert with check (
    auth.uid() = helper_id
    and can_offer_arrival_help(helper_id)
  );
