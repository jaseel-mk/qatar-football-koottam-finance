-- Qatar Football Koottam Finance
-- Run this in Supabase SQL Editor.
-- IMPORTANT: RLS is enabled. The browser uses only the publishable/anon key.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  match_number integer not null unique check (match_number > 0),
  match_date date not null,
  players integer not null default 0 check (players >= 0),
  collection_per_player numeric(10,2) not null default 10 check (collection_per_player >= 0),
  total_collected numeric(10,2) not null default 0 check (total_collected >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null,
  match_id uuid not null references public.matches(id) on delete cascade,
  category text not null check (category in ('Ground','Water','Equipment','Food','Other')),
  amount numeric(10,2) not null check (amount > 0),
  paid_by uuid not null references public.members(id),
  description text,
  created_at timestamptz not null default now()
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
  check (from_member_id is not null or to_member_id is not null),
  check (from_member_id is null or to_member_id is null or from_member_id <> to_member_id)
);

create index if not exists expenses_match_idx on public.expenses(match_id);
create index if not exists expenses_paid_by_idx on public.expenses(paid_by);
create index if not exists cash_transactions_date_idx on public.cash_transactions(transaction_date);
create index if not exists cash_transactions_from_idx on public.cash_transactions(from_member_id);
create index if not exists cash_transactions_to_idx on public.cash_transactions(to_member_id);

-- RLS: this app is intended for the private football group.
-- Any signed-in member can read/write the shared finance data.
alter table public.members enable row level security;
alter table public.matches enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_transactions enable row level security;

drop policy if exists "members authenticated read" on public.members;
drop policy if exists "members authenticated write" on public.members;
create policy "members authenticated read" on public.members for select to authenticated using (true);
create policy "members authenticated write" on public.members for all to authenticated using (true) with check (true);

drop policy if exists "matches authenticated all" on public.matches;
create policy "matches authenticated all" on public.matches for all to authenticated using (true) with check (true);

drop policy if exists "expenses authenticated all" on public.expenses;
create policy "expenses authenticated all" on public.expenses for all to authenticated using (true) with check (true);

drop policy if exists "cash authenticated all" on public.cash_transactions;
create policy "cash authenticated all" on public.cash_transactions for all to authenticated using (true) with check (true);

-- Grants required by the Data API.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.members to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.cash_transactions to authenticated;

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
