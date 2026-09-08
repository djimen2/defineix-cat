-- DEFINEIX! · Backend base per Supabase
-- Aquesta migració NO s'executa automàticament a GitHub Pages.
-- Es desplegarà al projecte Supabase quan estigui connectat.

create extension if not exists pgcrypto;

create type public.defineix_mode as enum ('play','training','daily');
create type public.defineix_challenge_type as enum ('build','order','missing','surplus');
create type public.defineix_season_type as enum ('term','year','summer');

create table public.players (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  alias text not null check (char_length(alias) between 1 and 32),
  grade smallint not null check (grade between 1 and 6),
  school text not null default '' check (char_length(school) <= 120),
  municipality text not null default '' check (char_length(municipality) <= 120),
  xp bigint not null default 0 check (xp >= 0),
  points bigint not null default 0 check (points >= 0),
  daily_streak integer not null default 0 check (daily_streak >= 0),
  daily_completed integer not null default 0 check (daily_completed >= 0),
  last_daily_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_secrets (
  player_id uuid primary key references public.players(id) on delete cascade,
  recovery_hash bytea not null unique,
  created_at timestamptz not null default now()
);

create table public.player_devices (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  token_hash bytea not null unique,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index player_devices_player_idx on public.player_devices(player_id);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  season_type public.defineix_season_type not null,
  start_date date not null,
  end_date date not null,
  is_visible boolean not null default true,
  check (end_date >= start_date)
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  client_session_id text not null,
  mode public.defineix_mode not null,
  attempt_count smallint not null default 0,
  perfect_count smallint not null default 0,
  xp_awarded integer not null default 0,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique(player_id, client_session_id)
);

create index sessions_player_created_idx on public.sessions(player_id, created_at desc);

create table public.attempts (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.sessions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  word_id text not null check (char_length(word_id) between 1 and 120),
  challenge_type public.defineix_challenge_type not null,
  difficulty smallint not null check (difficulty between 1 and 5),
  perfect boolean not null,
  xp_awarded smallint not null default 0,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create index attempts_player_created_idx on public.attempts(player_id, created_at desc);
create index attempts_word_idx on public.attempts(word_id);

create table public.daily_results (
  player_id uuid not null references public.players(id) on delete cascade,
  challenge_date date not null,
  perfect_count smallint not null check (perfect_count between 0 and 3),
  completed boolean not null,
  created_at timestamptz not null default now(),
  primary key(player_id, challenge_date)
);

create table public.player_season_stats (
  player_id uuid not null references public.players(id) on delete cascade,
  season_id uuid not null references public.seasons(id) on delete cascade,
  xp bigint not null default 0,
  points bigint not null default 0,
  games integer not null default 0,
  perfect integer not null default 0,
  daily_completed integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key(player_id, season_id)
);

-- Sense polítiques: el client NO pot llegir ni escriure directament les taules.
-- Totes les operacions públiques passen per RPCs SECURITY DEFINER.
alter table public.players enable row level security;
alter table public.player_secrets enable row level security;
alter table public.player_devices enable row level security;
alter table public.seasons enable row level security;
alter table public.sessions enable row level security;
alter table public.attempts enable row level security;
alter table public.daily_results enable row level security;
alter table public.player_season_stats enable row level security;

revoke all on public.players from anon, authenticated;
revoke all on public.player_secrets from anon, authenticated;
revoke all on public.player_devices from anon, authenticated;
revoke all on public.seasons from anon, authenticated;
revoke all on public.sessions from anon, authenticated;
revoke all on public.attempts from anon, authenticated;
revoke all on public.daily_results from anon, authenticated;
revoke all on public.player_season_stats from anon, authenticated;

create or replace function public.defineix_random_code(p_length integer)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  bytes bytea;
  result text := '';
  i integer;
begin
  if p_length < 1 or p_length > 128 then
    raise exception 'Invalid code length';
  end if;
  bytes := gen_random_bytes(p_length);
  for i in 0..p_length-1 loop
    result := result || substr(alphabet, (get_byte(bytes, i) % length(alphabet)) + 1, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.defineix_issue_device(p_player_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  token text;
begin
  loop
    token := public.defineix_random_code(40);
    begin
      insert into public.player_devices(player_id, token_hash)
      values (p_player_id, digest(token, 'sha256'));
      exit;
    exception when unique_violation then
      -- Extremadament improbable; genera un altre token.
    end;
  end loop;
  return token;
end;
$$;

create or replace function public.defineix_player_from_token(p_device_token text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
begin
  if p_device_token is null or char_length(trim(p_device_token)) < 20 then
    return null;
  end if;

  select d.player_id into pid
  from public.player_devices d
  join public.players p on p.id = d.player_id
  where d.token_hash = digest(upper(trim(p_device_token)), 'sha256')
    and d.revoked_at is null
    and p.is_active = true
  limit 1;

  if pid is not null then
    update public.player_devices
      set last_seen_at = now()
      where token_hash = digest(upper(trim(p_device_token)), 'sha256')
        and revoked_at is null;
  end if;

  return pid;
end;
$$;

create or replace function public.register_defineix_player(
  p_alias text,
  p_grade smallint,
  p_school text default '',
  p_municipality text default ''
)
returns table(
  player_id uuid,
  public_code text,
  recovery_code text,
  device_token text,
  alias text,
  grade smallint,
  school text,
  municipality text,
  xp bigint,
  points bigint,
  daily_streak integer,
  daily_completed integer
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
  pub_code text;
  rec_code text;
  dev_token text;
begin
  if p_alias is null or char_length(trim(p_alias)) < 1 or char_length(trim(p_alias)) > 32 then
    raise exception 'Alias invàlid';
  end if;
  if p_grade < 1 or p_grade > 6 then
    raise exception 'Curs invàlid';
  end if;

  loop
    pub_code := public.defineix_random_code(4) || '-' || public.defineix_random_code(4);
    exit when not exists(select 1 from public.players where players.public_code = pub_code);
  end loop;

  rec_code := public.defineix_random_code(5) || '-' || public.defineix_random_code(5) || '-' ||
              public.defineix_random_code(5) || '-' || public.defineix_random_code(5);

  insert into public.players(public_code, alias, grade, school, municipality)
  values (
    pub_code,
    trim(p_alias),
    p_grade,
    left(coalesce(trim(p_school), ''), 120),
    left(coalesce(trim(p_municipality), ''), 120)
  ) returning id into pid;

  insert into public.player_secrets(player_id, recovery_hash)
  values(pid, digest(upper(rec_code), 'sha256'));

  dev_token := public.defineix_issue_device(pid);

  return query
  select p.id, p.public_code, rec_code, dev_token, p.alias, p.grade, p.school, p.municipality,
         p.xp, p.points, p.daily_streak, p.daily_completed
  from public.players p where p.id = pid;
end;
$$;

create or replace function public.recover_defineix_player(p_recovery_code text)
returns table(
  player_id uuid,
  public_code text,
  device_token text,
  alias text,
  grade smallint,
  school text,
  municipality text,
  xp bigint,
  points bigint,
  daily_streak integer,
  daily_completed integer
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
  dev_token text;
begin
  if p_recovery_code is null or char_length(trim(p_recovery_code)) < 20 then
    raise exception 'Codi de recuperació invàlid';
  end if;

  select s.player_id into pid
  from public.player_secrets s
  join public.players p on p.id = s.player_id
  where s.recovery_hash = digest(upper(trim(p_recovery_code)), 'sha256')
    and p.is_active = true
  limit 1;

  if pid is null then
    raise exception 'Codi de recuperació no trobat';
  end if;

  dev_token := public.defineix_issue_device(pid);

  return query
  select p.id, p.public_code, dev_token, p.alias, p.grade, p.school, p.municipality,
         p.xp, p.points, p.daily_streak, p.daily_completed
  from public.players p where p.id = pid;
end;
$$;

create or replace function public.get_defineix_profile(p_device_token text)
returns table(
  player_id uuid,
  public_code text,
  alias text,
  grade smallint,
  school text,
  municipality text,
  xp bigint,
  points bigint,
  daily_streak integer,
  daily_completed integer
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;

  return query
  select p.id, p.public_code, p.alias, p.grade, p.school, p.municipality,
         p.xp, p.points, p.daily_streak, p.daily_completed
  from public.players p where p.id = pid;
end;
$$;

create or replace function public.update_defineix_profile(
  p_device_token text,
  p_alias text,
  p_grade smallint,
  p_school text default '',
  p_municipality text default ''
)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  if p_alias is null or char_length(trim(p_alias)) < 1 or char_length(trim(p_alias)) > 32 then
    raise exception 'Alias invàlid';
  end if;
  if p_grade < 1 or p_grade > 6 then raise exception 'Curs invàlid'; end if;

  update public.players
  set alias = trim(p_alias),
      grade = p_grade,
      school = left(coalesce(trim(p_school), ''), 120),
      municipality = left(coalesce(trim(p_municipality), ''), 120),
      updated_at = now()
  where id = pid;
end;
$$;

create or replace function public.submit_defineix_session(
  p_device_token text,
  p_client_session_id text,
  p_mode text,
  p_attempts jsonb
)
returns table(
  session_id uuid,
  xp_awarded integer,
  points_awarded integer,
  total_xp bigint,
  total_points bigint,
  daily_streak integer,
  daily_completed integer,
  daily_success boolean
)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare
  pid uuid;
  player_grade smallint;
  mode_value public.defineix_mode;
  max_attempts integer;
  attempt_total integer;
  item jsonb;
  ctype public.defineix_challenge_type;
  wordid text;
  diff smallint;
  isperfect boolean;
  row_xp integer;
  row_points integer;
  sum_xp integer := 0;
  sum_points integer := 0;
  perfect_total integer := 0;
  streak integer := 0;
  sid uuid;
  existing public.sessions%rowtype;
  local_date date := (now() at time zone 'Europe/Madrid')::date;
  daily_was_new boolean := false;
  daily_ok boolean := false;
  s public.seasons%rowtype;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  if p_client_session_id is null or char_length(trim(p_client_session_id)) < 8 or char_length(trim(p_client_session_id)) > 120 then
    raise exception 'Identificador de partida invàlid';
  end if;

  select * into existing from public.sessions
  where player_id = pid and client_session_id = trim(p_client_session_id);

  if found then
    return query
    select existing.id, existing.xp_awarded, existing.points_awarded,
           p.xp, p.points, p.daily_streak, p.daily_completed,
           coalesce(dr.completed, false)
    from public.players p
    left join public.daily_results dr on dr.player_id = p.id and dr.challenge_date = local_date
    where p.id = pid;
    return;
  end if;

  begin
    mode_value := p_mode::public.defineix_mode;
  exception when others then
    raise exception 'Mode invàlid';
  end;

  if jsonb_typeof(p_attempts) <> 'array' then raise exception 'Intents invàlids'; end if;
  attempt_total := jsonb_array_length(p_attempts);
  max_attempts := case mode_value when 'play' then 10 when 'training' then 8 else 3 end;
  if attempt_total < 1 or attempt_total > max_attempts then raise exception 'Nombre d’intents invàlid'; end if;

  select grade into player_grade from public.players where id = pid;

  insert into public.sessions(player_id, client_session_id, mode)
  values(pid, trim(p_client_session_id), mode_value)
  returning id into sid;

  for item in select value from jsonb_array_elements(p_attempts) loop
    begin
      ctype := (item->>'type')::public.defineix_challenge_type;
    exception when others then
      raise exception 'Tipus de repte invàlid';
    end;

    wordid := left(coalesce(item->>'wordId',''), 120);
    if char_length(wordid) < 1 then raise exception 'Paraula invàlida'; end if;

    diff := greatest(1, least(5, coalesce((item->>'difficulty')::smallint, 3)));
    isperfect := coalesce((item->>'perfect')::boolean, false);

    if isperfect then
      streak := streak + 1;
      perfect_total := perfect_total + 1;
      if mode_value = 'training' then
        row_xp := 8 + diff * 2;
        row_points := 0;
      elsif mode_value = 'daily' then
        row_xp := 15 + diff * 3;
        row_points := 0;
      else
        row_xp := 14 + diff * 3 + player_grade;
        row_points := 70 + diff * 30 + player_grade * 5 + least(streak,5) * 10;
      end if;
    else
      streak := 0;
      row_xp := 3;
      row_points := 0;
    end if;

    sum_xp := sum_xp + row_xp;
    sum_points := sum_points + row_points;

    insert into public.attempts(session_id, player_id, word_id, challenge_type, difficulty, perfect, xp_awarded, points_awarded)
    values(sid, pid, wordid, ctype, diff, isperfect, row_xp, row_points);
  end loop;

  update public.sessions
  set attempt_count = attempt_total,
      perfect_count = perfect_total,
      xp_awarded = sum_xp,
      points_awarded = sum_points
  where id = sid;

  if mode_value = 'daily' then
    daily_ok := perfect_total >= 2;
    insert into public.daily_results(player_id, challenge_date, perfect_count, completed)
    values(pid, local_date, perfect_total, daily_ok)
    on conflict(player_id, challenge_date) do nothing;
    get diagnostics attempt_total = row_count;
    daily_was_new := attempt_total = 1;
  end if;

  update public.players p
  set xp = p.xp + sum_xp,
      points = p.points + sum_points,
      daily_streak = case
        when mode_value = 'daily' and daily_was_new and daily_ok then
          case when p.last_daily_date = local_date - 1 then p.daily_streak + 1 else 1 end
        else p.daily_streak
      end,
      daily_completed = case
        when mode_value = 'daily' and daily_was_new and daily_ok then p.daily_completed + 1
        else p.daily_completed
      end,
      last_daily_date = case
        when mode_value = 'daily' and daily_was_new and daily_ok then local_date
        else p.last_daily_date
      end,
      updated_at = now()
  where p.id = pid;

  for s in select * from public.seasons
           where is_visible = true and local_date between start_date and end_date loop
    insert into public.player_season_stats(player_id, season_id, xp, points, games, perfect, daily_completed)
    values(
      pid, s.id, sum_xp, sum_points,
      case when mode_value = 'play' then 1 else 0 end,
      perfect_total,
      case when mode_value = 'daily' and daily_was_new and daily_ok then 1 else 0 end
    )
    on conflict(player_id, season_id) do update
    set xp = public.player_season_stats.xp + excluded.xp,
        points = public.player_season_stats.points + excluded.points,
        games = public.player_season_stats.games + excluded.games,
        perfect = public.player_season_stats.perfect + excluded.perfect,
        daily_completed = public.player_season_stats.daily_completed + excluded.daily_completed,
        updated_at = now();
  end loop;

  return query
  select sid, sum_xp, sum_points, p.xp, p.points, p.daily_streak, p.daily_completed, daily_ok
  from public.players p where p.id = pid;
end;
$$;

create or replace function public.get_defineix_leaderboard(
  p_metric text default 'points',
  p_season_slug text default null,
  p_grade smallint default null,
  p_cycle text default null,
  p_school text default null,
  p_municipality text default null,
  p_limit integer default 50
)
returns table(
  rank bigint,
  alias text,
  grade smallint,
  school text,
  municipality text,
  score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with selected as (
    select
      p.id,
      p.alias,
      p.grade,
      p.school,
      p.municipality,
      case
        when lower(coalesce(p_metric,'points')) = 'daily' then
          case when p_season_slug is null then p.daily_completed::bigint else coalesce(ps.daily_completed,0)::bigint end
        else
          case when p_season_slug is null then p.points::bigint else coalesce(ps.points,0)::bigint end
      end as metric_value
    from public.players p
    left join public.seasons s on s.slug = p_season_slug
    left join public.player_season_stats ps on ps.player_id = p.id and ps.season_id = s.id
    where p.is_active = true
      and (p_grade is null or p.grade = p_grade)
      and (p_cycle is null or
           (lower(p_cycle) in ('inicial','ci') and p.grade in (1,2)) or
           (lower(p_cycle) in ('mitja','cm') and p.grade in (3,4)) or
           (lower(p_cycle) in ('superior','cs') and p.grade in (5,6)))
      and (p_school is null or lower(trim(p.school)) = lower(trim(p_school)))
      and (p_municipality is null or lower(trim(p.municipality)) = lower(trim(p_municipality)))
  ), ranked as (
    select dense_rank() over(order by metric_value desc, alias asc) as rnk,
           alias, grade, school, municipality, metric_value
    from selected
  )
  select rnk, alias, grade, school, municipality, metric_value
  from ranked
  order by rnk, alias
  limit greatest(1, least(coalesce(p_limit,50), 100));
$$;

-- Revoca execució pública implícita i exposa només les RPC necessàries al client.
revoke all on function public.defineix_random_code(integer) from public;
revoke all on function public.defineix_issue_device(uuid) from public;
revoke all on function public.defineix_player_from_token(text) from public;
revoke all on function public.register_defineix_player(text,smallint,text,text) from public;
revoke all on function public.recover_defineix_player(text) from public;
revoke all on function public.get_defineix_profile(text) from public;
revoke all on function public.update_defineix_profile(text,text,smallint,text,text) from public;
revoke all on function public.submit_defineix_session(text,text,text,jsonb) from public;
revoke all on function public.get_defineix_leaderboard(text,text,smallint,text,text,text,integer) from public;

grant execute on function public.register_defineix_player(text,smallint,text,text) to anon, authenticated;
grant execute on function public.recover_defineix_player(text) to anon, authenticated;
grant execute on function public.get_defineix_profile(text) to anon, authenticated;
grant execute on function public.update_defineix_profile(text,text,smallint,text,text) to anon, authenticated;
grant execute on function public.submit_defineix_session(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.get_defineix_leaderboard(text,text,smallint,text,text,text,integer) to anon, authenticated;
