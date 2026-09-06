-- Marks seeded demo profiles so the UI can show a "Demo" tag on their cards
-- and a persistent banner while demo data is still in the mix.
alter table profiles add column if not exists is_demo boolean not null default false;
