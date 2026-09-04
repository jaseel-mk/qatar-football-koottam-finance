-- ============================================================
-- QATAR FOOTBALL KOOTTAM FINANCE
-- SAFE MIGRATION: EXISTING AUTH APP + NEW NO-AUTH APP
--
-- Purpose:
--   1. Preserve all current data.
--   2. Keep the current authenticated application working.
--   3. Allow the new "Who are you?" application to use the anon key.
--   4. Add audit fields for created / edited / deleted tracking.
--   5. Support soft deletion used by the new app.
--
-- IMPORTANT:
--   - This script DOES NOT drop tables.
--   - This script DOES NOT delete existing rows.
--   - This script DOES NOT re-seed sample matches/expenses/cash.
--   - Existing authenticated policies are kept/re-created.
--   - Anonymous access is added in parallel for testing/migration.
-- ============================================================

begin;

-- ============================================================
-- 1. ADD AUDIT COLUMNS
-- ============================================================

alter table public.members
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz;

alter table public.matches
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz;

alter table public.expenses
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz;

alter table public.cash_transactions
  add column if not exists created_by text,
  add column if not exists updated_by text,
  add column if not exists updated_at timestamptz,
  add column if not exists deleted_by text,
  add column if not exists deleted_at timestamptz;


-- ============================================================
-- 2. MARK EXISTING HISTORICAL ROWS
--
-- We do not know who originally entered the old records,
-- therefore existing rows are marked as "System".
-- ============================================================

update public.members
set created_by = 'System'
where created_by is null;

update public.matches
set created_by = 'System'
where created_by is null;

update public.expenses
set created_by = 'System'
where created_by is null;

update public.cash_transactions
set created_by = 'System'
where created_by is null;


-- ============================================================
-- 3. OPTIONAL DEFAULT FOR OLD / LEGACY APP INSERTS
--
-- The old authenticated app does not send created_by.
-- Giving created_by a default prevents new rows from being blank
-- while both app versions are temporarily available.
--
-- The NEW app explicitly sends a person's name, so this default
-- will not override the new app's value.
-- ============================================================

alter table public.members
  alter column created_by set default 'Legacy App';

alter table public.matches
  alter column created_by set default 'Legacy App';

alter table public.expenses
  alter column created_by set default 'Legacy App';

alter table public.cash_transactions
  alter column created_by set default 'Legacy App';


-- ============================================================
-- 4. ENSURE ROW LEVEL SECURITY IS ENABLED
-- ============================================================

alter table public.members enable row level security;
alter table public.matches enable row level security;
alter table public.expenses enable row level security;
alter table public.cash_transactions enable row level security;


-- ============================================================
-- 5. KEEP / RESTORE AUTHENTICATED ACCESS
--
-- These are the policies used by your current application.
-- ============================================================

drop policy if exists "members authenticated read"
on public.members;

drop policy if exists "members authenticated write"
on public.members;

create policy "members authenticated read"
on public.members
for select
to authenticated
using (true);

create policy "members authenticated write"
on public.members
for all
to authenticated
using (true)
with check (true);


drop policy if exists "matches authenticated all"
on public.matches;

create policy "matches authenticated all"
on public.matches
for all
to authenticated
using (true)
with check (true);


drop policy if exists "expenses authenticated all"
on public.expenses;

create policy "expenses authenticated all"
on public.expenses
for all
to authenticated
using (true)
with check (true);


drop policy if exists "cash authenticated all"
on public.cash_transactions;

create policy "cash authenticated all"
on public.cash_transactions
for all
to authenticated
using (true)
with check (true);


-- ============================================================
-- 6. ADD ANONYMOUS ACCESS FOR THE NEW APPLICATION
--
-- The new application uses the publishable / anon key and
-- identifies the user through the "Who are you?" screen.
-- ============================================================

drop policy if exists "members anon all"
on public.members;

create policy "members anon all"
on public.members
for all
to anon
using (true)
with check (true);


drop policy if exists "matches anon all"
on public.matches;

create policy "matches anon all"
on public.matches
for all
to anon
using (true)
with check (true);


drop policy if exists "expenses anon all"
on public.expenses;

create policy "expenses anon all"
on public.expenses
for all
to anon
using (true)
with check (true);


drop policy if exists "cash anon all"
on public.cash_transactions;

create policy "cash anon all"
on public.cash_transactions
for all
to anon
using (true)
with check (true);


-- ============================================================
-- 7. DATABASE API GRANTS
--
-- Keep authenticated grants for the current app.
-- Add anon grants for the new app.
-- ============================================================

grant usage on schema public to authenticated;
grant usage on schema public to anon;

grant select, insert, update, delete
on public.members
to authenticated, anon;

grant select, insert, update, delete
on public.matches
to authenticated, anon;

grant select, insert, update, delete
on public.expenses
to authenticated, anon;

grant select, insert, update, delete
on public.cash_transactions
to authenticated, anon;


-- ============================================================
-- 8. INDEXES FOR SOFT-DELETE FILTERING
-- ============================================================

create index if not exists members_deleted_at_idx
  on public.members(deleted_at);

create index if not exists matches_deleted_at_idx
  on public.matches(deleted_at);

create index if not exists expenses_deleted_at_idx
  on public.expenses(deleted_at);

create index if not exists cash_transactions_deleted_at_idx
  on public.cash_transactions(deleted_at);


commit;


-- ============================================================
-- MIGRATION COMPLETE
--
-- After running this:
--
-- CURRENT MAIN APP:
--   - Authentication still works.
--   - Existing data remains available.
--
-- NEW BRANCH:
--   - Can work without Supabase login.
--   - Can read/write with anon key.
--   - Can store created_by / updated_by / deleted_by.
--   - Can soft-delete using deleted_at.
--
-- SECURITY NOTE:
-- Anonymous write access means anyone who can load the frontend
-- and obtain its public Supabase configuration can potentially
-- write to these tables. This is suitable only for a trusted,
-- low-risk group app unless stronger access controls are added.
-- ============================================================
