-- DEFINEIX! · Estat del jugador recuperable entre dispositius.

alter table public.players
  add column if not exists client_state jsonb not null default '{}'::jsonb;

alter table public.players
  add constraint players_client_state_object
  check (jsonb_typeof(client_state) = 'object' and pg_column_size(client_state) <= 131072);

create or replace function public.sync_defineix_state(p_device_token text, p_state jsonb)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare pid uuid;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' then raise exception 'Estat invàlid'; end if;
  if pg_column_size(p_state) > 131072 then raise exception 'Estat massa gran'; end if;
  update public.players set client_state=p_state, updated_at=now() where id=pid;
  return true;
end;
$$;

create or replace function public.rotate_defineix_recovery(p_device_token text)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare pid uuid; rec_code text;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  rec_code := public.defineix_random_code(5)||'-'||public.defineix_random_code(5)||'-'||public.defineix_random_code(5)||'-'||public.defineix_random_code(5);
  update public.player_secrets set recovery_hash=digest(upper(rec_code),'sha256') where player_id=pid;
  return rec_code;
end;
$$;

drop function if exists public.recover_defineix_player(text);
create function public.recover_defineix_player(p_recovery_code text)
returns table(
  player_id uuid, public_code text, device_token text, alias text, grade smallint,
  school text, municipality text, xp bigint, points bigint, daily_streak integer,
  daily_completed integer, client_state jsonb
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare pid uuid; dev_token text;
begin
  if p_recovery_code is null or char_length(trim(p_recovery_code))<20 then raise exception 'Codi de recuperació invàlid'; end if;
  select s.player_id into pid
  from public.player_secrets s join public.players p on p.id=s.player_id
  where s.recovery_hash=digest(upper(trim(p_recovery_code)),'sha256') and p.is_active=true limit 1;
  if pid is null then raise exception 'Codi de recuperació no trobat'; end if;
  dev_token:=public.defineix_issue_device(pid);
  return query select p.id,p.public_code,dev_token,p.alias,p.grade,p.school,p.municipality,p.xp,p.points,p.daily_streak,p.daily_completed,p.client_state
  from public.players p where p.id=pid;
end;
$$;

drop function if exists public.get_defineix_profile(text);
create function public.get_defineix_profile(p_device_token text)
returns table(
  player_id uuid, public_code text, alias text, grade smallint, school text,
  municipality text, xp bigint, points bigint, daily_streak integer,
  daily_completed integer, client_state jsonb
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare pid uuid;
begin
  pid:=public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  return query select p.id,p.public_code,p.alias,p.grade,p.school,p.municipality,p.xp,p.points,p.daily_streak,p.daily_completed,p.client_state
  from public.players p where p.id=pid;
end;
$$;

revoke all on function public.sync_defineix_state(text,jsonb) from public,anon,authenticated;
revoke all on function public.rotate_defineix_recovery(text) from public,anon,authenticated;
revoke all on function public.recover_defineix_player(text) from public,anon,authenticated;
revoke all on function public.get_defineix_profile(text) from public,anon,authenticated;
grant execute on function public.sync_defineix_state(text,jsonb) to anon,authenticated;
grant execute on function public.rotate_defineix_recovery(text) to anon,authenticated;
grant execute on function public.recover_defineix_player(text) to anon,authenticated;
grant execute on function public.get_defineix_profile(text) to anon,authenticated;

insert into public.seasons(slug,name,season_type,start_date,end_date,is_visible)
values
  ('curs-2026-27','Curs 2026-27','year','2026-09-08','2027-06-18',true),
  ('1r-trimestre-2026-27','1r trimestre 2026-27','term','2026-09-08','2026-12-22',true)
on conflict(slug) do update set
  name=excluded.name, season_type=excluded.season_type,
  start_date=excluded.start_date, end_date=excluded.end_date,
  is_visible=excluded.is_visible;
