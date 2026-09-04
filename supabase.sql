-- Qatar Football Koottam Finance
-- Modified version: no Supabase Authentication login.
-- Run this in Supabase SQL Editor.
-- IMPORTANT: The browser uses only the publishable/anon key.
-- The selected member name is an audit label, NOT secure authentication.

create extension if not exists pgcrypto;

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by text not null default 'System',
  updated_at timestamptz,
  updated_by text,
  deleted_at timestamptz,
  deleted_by text
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer not null unique check (match_number > 0),
  match_date date not null,
  players integer not null default 0 check (players >= 0),
  collection_per_player numeric(10,2) not null default 10 check (collection_per_player >= 0),
  total_collected numeric(10,2) not null default 0 check (total_collected >= 0),
  notes text,
  created_at timestamptz not null default now(),
  created_by text not null default 'System',
  updated_at timestamptz,
  updated_by text,
  deleted_at timestamptz,
  deleted_by text
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  match_id uuid not null references public.matches(id) on delete cascade,
  category text not null check (category in ('Ground','Water','Equipment','Food','Other')),
  amount numeric(10,2) not null check (amount > 0),
  paid_by uuid not null references public.members(id),
  description text,
  created_at timestamptz not null default now(),
  created_by text not null default 'System',
  updated_at timestamptz,
  updated_by text,
  deleted_at timestamptz,
  deleted_by text
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null,
  type text not null check (type in ('match_collection','expense_payment','cash_transfer','cash_adjustment')),
  amount numeric(10,2) not null check (amount > 0),
  from_member_id uuid references public.members(id),
  to_member_id uuid references public.members(id),
  match_id uuid references public.matches(id) on delete set null,
  description text,
  created_at timestamptz not null default now(),
  created_by text not null default 'System',
  updated_at timestamptz,
  updated_by text,
  deleted_at timestamptz,
  deleted_by text,
  check (from_member_id is not null or to_member_id is not null),
  check (from_member_id is null or to_member_id is null or from_member_id <> to_member_id)
);

-- ============================================================
-- MIGRATION FOR DATABASES CREATED WITH THE OLD FILE
-- CREATE TABLE IF NOT EXISTS does not add missing columns.
-- ============================================================

alter table public.members
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

alter table public.matches
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

alter table public.expenses
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

alter table public.cash_transactions
  add column if not exists created_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists updated_by text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;

-- Existing rows predate audit tracking, so label them System.
update public.members set created_by = 'System' where created_by is null;
update public.matches set created_by = 'System' where created_by is null;
update public.expenses set created_by = 'System' where created_by is null;
update public.cash_transactions set created_by = 'System' where created_by is null;

alter table public.members alter column created_by set default 'System';
alter table public.matches alter column created_by set default 'System';
alter table public.expenses alter column created_by set default 'System';
alter table public.cash_transactions alter column created_by set default 'System';

alter table public.members alter column created_by set not null;
alter table public.matches alter column created_by set not null;
alter table public.expenses alter column created_by set not null;
alter table public.cash_transactions alter column created_by set not null;

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists expenses_match_idx on public.expenses(match_id);
create index if not exists expenses_paid_by_idx on public.expenses(paid_by);
create index if not exists cash_transactions_date_idx on public.cash_transactions(transaction_date);
create index if not exists cash_transactions_from_idx on public.cash_transactions(from_member_id);
create index if not exists cash_transactions_to_idx on public.cash_transactions(to_member_id);
create index if not exists matches_deleted_idx on public.matches(deleted_at);
create index if not exists expenses_deleted_idx on public.expenses(deleted_at);
create index if not exists cash_transactions_deleted_idx on public.cash_transactions(deleted_at);

-- ============================================================
-- RLS + ANON ACCESS
-- Authentication has been removed from the frontend.
-- ============================================================

alter table public.members enable row level security;
alter table public.matches enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_transactions enable row level security;

-- Remove old authenticated-only policies.
drop policy if exists "members authenticated read" on public.members;
drop policy if exists "members authenticated write" on public.members;
drop policy if exists "matches authenticated all" on public.matches;
drop policy if exists "expenses authenticated all" on public.expenses;
drop policy if exists "cash authenticated all" on public.cash_transactions;

-- Allow re-running this modified file safely.
drop policy if exists "members anon all" on public.members;
drop policy if exists "matches anon all" on public.matches;
drop policy if exists "expenses anon all" on public.expenses;
drop policy if exists "cash anon all" on public.cash_transactions;

create policy "members anon all"
on public.members for all to anon
using (true) with check (true);

create policy "matches anon all"
on public.matches for all to anon
using (true) with check (true);

create policy "expenses anon all"
on public.expenses for all to anon
using (true) with check (true);

create policy "cash anon all"
on public.cash_transactions for all to anon
using (true) with check (true);

grant usage on schema public to anon;
grant select, insert, update, delete on public.members to anon;
grant select, insert, update, delete on public.matches to anon;
grant select, insert, update, delete on public.expenses to anon;
grant select, insert, update, delete on public.cash_transactions to anon;

-- Keep authenticated grants too. They are harmless if you later re-enable Auth.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.cash_transactions to authenticated;

-- ============================================================
-- SAMPLE / EXISTING SEED DATA
-- ============================================================

-- Seed members.
insert into public.members (name) values ('Jaseel') on conflict (name) do nothing;
insert into public.members (name) values ('Nashid') on conflict (name) do nothing;

-- Optional sample matches from your current sheet.
insert into public.matches(match_number,match_date,players,collection_per_player,total_collected,notes)
values
(1,'2026-08-07',14,10,140,'Imported from original finance sheet'),
(2,'2026-08-12',19,10,190,'Imported from original finance sheet'),
(3,'2026-08-14',15,10,150,'Imported from original finance sheet')
on conflict (match_number) do nothing;

-- Add sample expenses.
insert into public.expenses(expense_date,match_id,category,amount,paid_by,description)
select '2026-08-07', id, 'Ground', 150, (select id from public.members where name='Jaseel'), 'Ground'
from public.matches where match_number=1
and not exists (select 1 from public.expenses e where e.match_id=public.matches.id and e.category='Ground');

insert into public.expenses(expense_date,match_id,category,amount,paid_by,description)
select '2026-08-12', id, 'Ground', 150, (select id from public.members where name='Nashid'), 'Ground'
from public.matches where match_number=2
and not exists (select 1 from public.expenses e where e.match_id=public.matches.id and e.category='Ground');

insert into public.expenses(expense_date,match_id,category,amount,paid_by,description)
select '2026-08-12', id, 'Water', 12, (select id from public.members where name='Nashid'), 'Water'
from public.matches where match_number=2
and not exists (select 1 from public.expenses e where e.match_id=public.matches.id and e.category='Water');

insert into public.expenses(expense_date,match_id,category,amount,paid_by,description)
select '2026-08-14', id, 'Ground', 100, (select id from public.members where name='Jaseel'), 'Ground'
from public.matches where match_number=3
and not exists (select 1 from public.expenses e where e.match_id=public.matches.id and e.category='Ground');

-- Seed cash ledger so the sample data ends at Jaseel QAR 60 / Nashid QAR 18,
-- matching the figures in the sheet. These opening adjustments represent
-- historical cash movements not represented by the three imported matches.
do $$
declare
  j uuid; n uuid; m1 uuid; m2 uuid; m3 uuid;
begin
  select id into j from public.members where name='Jaseel';
  select id into n from public.members where name='Nashid';
  select id into m1 from public.matches where match_number=1;
  select id into m2 from public.matches where match_number=2;
  select id into m3 from public.matches where match_number=3;

  if not exists (select 1 from public.cash_transactions where description='Sample Match #1 collection') then
    insert into public.cash_transactions(transaction_date,type,amount,to_member_id,match_id,description)
    values ('2026-08-07','match_collection',140,j,m1,'Sample Match #1 collection');
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,match_id,description)
    values ('2026-08-07','expense_payment',150,j,m1,'Sample Match #1 ground');
    insert into public.cash_transactions(transaction_date,type,amount,to_member_id,match_id,description)
    values ('2026-08-12','match_collection',190,n,m2,'Sample Match #2 collection');
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,match_id,description)
    values ('2026-08-12','expense_payment',150,n,m2,'Sample Match #2 ground');
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,match_id,description)
    values ('2026-08-12','expense_payment',12,n,m2,'Sample Match #2 water');
    insert into public.cash_transactions(transaction_date,type,amount,to_member_id,match_id,description)
    values ('2026-08-14','match_collection',150,j,m3,'Sample Match #3 collection');
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,match_id,description)
    values ('2026-08-14','expense_payment',100,j,m3,'Sample Match #3 ground');

    -- Bring historical cash from the imported ledger to the balances in your sheet.
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,description)
    values ('2026-08-14','cash_adjustment',120,j,'Historical cash adjustment');
    insert into public.cash_transactions(transaction_date,type,amount,from_member_id,description)
    values ('2026-08-14','cash_adjustment',10,n,'Historical cash adjustment');
  end if;
end $$;
