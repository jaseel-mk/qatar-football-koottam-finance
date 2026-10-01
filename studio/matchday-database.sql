-- QFK Studio only. Run this file once in the existing Supabase SQL Editor.
-- No Finance tables, policies, rows or functions are changed.
begin;
create table if not exists public.qfk_matchday_workspace_v1 (
  id text primary key check (id = 'qfk'),
  revision integer not null check (revision > 0),
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint qfk_matchday_payload_v1 check (
    jsonb_typeof(payload) = 'object' and payload ->> 'version' = '1'
    and jsonb_typeof(payload -> 'matches') = 'array'
    and jsonb_typeof(payload -> 'players') = 'array'
    and jsonb_typeof(payload -> 'formations') = 'array'
  )
);
alter table public.qfk_matchday_workspace_v1 enable row level security;
-- This follows the existing trusted-group, no-login workflow.
-- Anyone with the app's public key can read/write Studio data; no admin menu.
grant select on public.qfk_matchday_workspace_v1 to anon, authenticated;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'qfk_matchday_workspace_v1' and policyname = 'qfk_matchday_read_v1') then
    create policy qfk_matchday_read_v1 on public.qfk_matchday_workspace_v1 for select to anon, authenticated using (id = 'qfk');
  end if;
end $$;
-- Writes go through a revision-checked, atomic function, not direct table updates.
create or replace function public.qfk_save_matchday_workspace_v1(p_expected_revision integer, p_payload jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare next_revision integer;
begin
  if p_expected_revision is null or p_expected_revision < 0 or p_payload is null
    or jsonb_typeof(p_payload) is distinct from 'object'
    or p_payload ->> 'version' is distinct from '1'
    or jsonb_typeof(p_payload -> 'matches') is distinct from 'array'
    or jsonb_typeof(p_payload -> 'players') is distinct from 'array'
    or jsonb_typeof(p_payload -> 'formations') is distinct from 'array'
    or octet_length(p_payload::text) > 20000000 then
    raise exception 'Invalid Studio payload' using errcode = '22023';
  end if;
  -- Prevent concurrent initial saves and stale overwrites from another device.
  perform pg_advisory_xact_lock(7214901);
  if p_expected_revision = 0 then
    insert into public.qfk_matchday_workspace_v1(id, revision, payload)
      values ('qfk', 1, p_payload) on conflict (id) do nothing returning revision into next_revision;
  else
    update public.qfk_matchday_workspace_v1 set payload = p_payload, revision = revision + 1, updated_at = now()
      where id = 'qfk' and revision = p_expected_revision returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'Studio revision conflict' using errcode = '40001'; end if;
  return next_revision;
end $$;
revoke all on function public.qfk_save_matchday_workspace_v1(integer, jsonb) from public;
grant execute on function public.qfk_save_matchday_workspace_v1(integer, jsonb) to anon, authenticated;
notify pgrst, 'reload schema';
commit;
