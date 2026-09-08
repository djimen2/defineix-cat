-- DEFINEIX! · Vista segura de mestre

create table public.teacher_accounts (
  id uuid primary key default gen_random_uuid(),
  login_code text not null unique,
  label text not null default 'Mestre',
  school_scope text not null default '',
  municipality_scope text not null default '',
  password_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_setup_tokens (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_accounts(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index teacher_setup_tokens_teacher_idx on public.teacher_setup_tokens(teacher_id);

create table public.teacher_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_accounts(id) on delete cascade,
  token_hash bytea not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index teacher_sessions_teacher_idx on public.teacher_sessions(teacher_id);

alter table public.teacher_accounts enable row level security;
alter table public.teacher_setup_tokens enable row level security;
alter table public.teacher_sessions enable row level security;
revoke all on public.teacher_accounts from anon, authenticated;
revoke all on public.teacher_setup_tokens from anon, authenticated;
revoke all on public.teacher_sessions from anon, authenticated;

create or replace function public.defineix_teacher_issue_session(p_teacher_id uuid)
returns text
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare token text;
begin
  if not exists(select 1 from public.teacher_accounts where id=p_teacher_id and is_active=true) then raise exception 'Mestre no vàlid'; end if;
  loop
    token := public.defineix_random_code(48);
    begin
      insert into public.teacher_sessions(teacher_id,token_hash,expires_at)
      values(p_teacher_id,digest(upper(token),'sha256'),now()+interval '30 days');
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  return token;
end;
$$;

create or replace function public.defineix_teacher_from_token(p_teacher_token text)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare tid uuid;
begin
  if p_teacher_token is null or char_length(trim(p_teacher_token)) < 24 then return null; end if;
  select s.teacher_id into tid
  from public.teacher_sessions s
  join public.teacher_accounts t on t.id=s.teacher_id
  where s.token_hash=digest(upper(trim(p_teacher_token)),'sha256')
    and s.revoked_at is null and s.expires_at>now() and t.is_active=true
  limit 1;
  if tid is not null then
    update public.teacher_sessions set last_seen_at=now()
    where token_hash=digest(upper(trim(p_teacher_token)),'sha256') and revoked_at is null;
  end if;
  return tid;
end;
$$;

create or replace function public.setup_defineix_teacher(p_setup_token text,p_password text)
returns table(login_code text,session_token text,label text,school text,municipality text)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare tid uuid; stoken text;
begin
  if p_setup_token is null or char_length(trim(p_setup_token))<24 then raise exception 'Enllaç de configuració invàlid'; end if;
  if p_password is null or char_length(p_password)<10 or char_length(p_password)>128 then raise exception 'La contrasenya ha de tenir entre 10 i 128 caràcters'; end if;
  select s.teacher_id into tid
  from public.teacher_setup_tokens s join public.teacher_accounts t on t.id=s.teacher_id
  where s.token_hash=digest(upper(trim(p_setup_token)),'sha256') and s.used_at is null and s.expires_at>now() and t.is_active=true
  limit 1;
  if tid is null then raise exception 'Enllaç de configuració caducat o ja utilitzat'; end if;
  update public.teacher_accounts set password_hash=crypt(p_password,gen_salt('bf',10)),updated_at=now() where id=tid;
  update public.teacher_setup_tokens set used_at=now() where teacher_id=tid and used_at is null;
  stoken:=public.defineix_teacher_issue_session(tid);
  return query select t.login_code,stoken,t.label,t.school_scope,t.municipality_scope from public.teacher_accounts t where t.id=tid;
end;
$$;

create or replace function public.login_defineix_teacher(p_login_code text,p_password text)
returns table(login_code text,session_token text,label text,school text,municipality text)
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare tid uuid; stoken text;
begin
  if p_login_code is null or p_password is null then raise exception 'Credencials incorrectes'; end if;
  select id into tid from public.teacher_accounts
  where upper(login_code)=upper(trim(p_login_code)) and is_active=true and password_hash is not null and password_hash=crypt(p_password,password_hash)
  limit 1;
  if tid is null then raise exception 'Credencials incorrectes'; end if;
  stoken:=public.defineix_teacher_issue_session(tid);
  return query select t.login_code,stoken,t.label,t.school_scope,t.municipality_scope from public.teacher_accounts t where t.id=tid;
end;
$$;

create or replace function public.logout_defineix_teacher(p_teacher_token text)
returns void
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
begin
  update public.teacher_sessions set revoked_at=now()
  where token_hash=digest(upper(trim(coalesce(p_teacher_token,''))),'sha256') and revoked_at is null;
end;
$$;

create or replace function public.get_defineix_teacher_dashboard(p_teacher_token text,p_grade smallint default null,p_days integer default 30)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare tid uuid; t public.teacher_accounts%rowtype; cutoff timestamptz; result jsonb;
begin
  tid:=public.defineix_teacher_from_token(p_teacher_token);
  if tid is null then raise exception 'Sessió de mestre no vàlida'; end if;
  select * into t from public.teacher_accounts where id=tid;
  if p_grade is not null and (p_grade<1 or p_grade>6) then raise exception 'Curs invàlid'; end if;
  p_days:=greatest(1,least(coalesce(p_days,30),3650)); cutoff:=now()-(p_days||' days')::interval;

  with sp as (
    select p.* from public.players p
    where p.is_active=true
      and (t.school_scope='' or lower(trim(p.school))=lower(trim(t.school_scope)))
      and (t.municipality_scope='' or lower(trim(p.municipality))=lower(trim(t.municipality_scope)))
      and (p_grade is null or p.grade=p_grade)
  ), pm as (
    select p.id,p.public_code,p.alias,p.grade,p.xp,p.points,p.daily_streak,p.daily_completed,p.client_state,
      count(distinct s.id) filter(where s.created_at>=cutoff)::int sessions_period,
      count(distinct s.id) filter(where s.created_at>=cutoff and s.mode='play')::int games_period,
      count(a.id) filter(where a.created_at>=cutoff)::int attempts_period,
      count(a.id) filter(where a.created_at>=cutoff and a.perfect)::int perfect_period,
      max(s.created_at) last_activity
    from sp p left join public.sessions s on s.player_id=p.id left join public.attempts a on a.session_id=s.id
    group by p.id,p.public_code,p.alias,p.grade,p.xp,p.points,p.daily_streak,p.daily_completed,p.client_state
  )
  select jsonb_build_object(
    'teacher',jsonb_build_object('label',t.label,'school',t.school_scope,'municipality',t.municipality_scope),
    'periodDays',p_days,
    'summary',jsonb_build_object(
      'players',(select count(*) from sp),
      'activePlayers',(select count(*) from pm where last_activity>=cutoff),
      'sessions',(select coalesce(sum(sessions_period),0) from pm),
      'games',(select coalesce(sum(games_period),0) from pm),
      'attempts',(select coalesce(sum(attempts_period),0) from pm),
      'perfect',(select coalesce(sum(perfect_period),0) from pm),
      'accuracy',case when (select coalesce(sum(attempts_period),0) from pm)>0 then round(100.0*(select coalesce(sum(perfect_period),0) from pm)/(select sum(attempts_period) from pm),1) else 0 end
    ),
    'players',coalesce((select jsonb_agg(jsonb_build_object(
      'code',public_code,'alias',alias,'grade',grade,'xp',xp,'points',points,'dailyStreak',daily_streak,'dailyCompleted',daily_completed,
      'sessions',sessions_period,'games',games_period,'attempts',attempts_period,'perfect',perfect_period,
      'accuracy',case when attempts_period>0 then round(100.0*perfect_period/attempts_period,1) else 0 end,
      'lastActivity',last_activity,'adaptive',coalesce(client_state->'adaptive','{}'::jsonb)
    ) order by alias) from pm),'[]'::jsonb),
    'challengeTypes',coalesce((select jsonb_agg(jsonb_build_object('type',x.challenge_type,'attempts',x.attempts,'errors',x.errors,'accuracy',case when x.attempts>0 then round(100.0*(x.attempts-x.errors)/x.attempts,1) else 0 end) order by x.challenge_type)
      from (select a.challenge_type::text challenge_type,count(*)::int attempts,count(*) filter(where not a.perfect)::int errors from public.attempts a join sp p on p.id=a.player_id where a.created_at>=cutoff group by a.challenge_type) x),'[]'::jsonb),
    'errors',coalesce((select jsonb_agg(jsonb_build_object('wordId',e.word_id,'errors',e.errors,'players',e.players) order by e.errors desc,e.word_id)
      from (select a.word_id,count(*)::int errors,count(distinct a.player_id)::int players from public.attempts a join sp p on p.id=a.player_id where a.created_at>=cutoff and not a.perfect group by a.word_id order by errors desc limit 20) e),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;

create or replace function public.get_defineix_teacher_player(p_teacher_token text,p_public_code text,p_days integer default 90)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public, extensions
as $$
declare tid uuid; t public.teacher_accounts%rowtype; pid uuid; cutoff timestamptz; result jsonb;
begin
  tid:=public.defineix_teacher_from_token(p_teacher_token);
  if tid is null then raise exception 'Sessió de mestre no vàlida'; end if;
  select * into t from public.teacher_accounts where id=tid;
  p_days:=greatest(1,least(coalesce(p_days,90),3650)); cutoff:=now()-(p_days||' days')::interval;
  select p.id into pid from public.players p
  where upper(p.public_code)=upper(trim(p_public_code)) and p.is_active=true
    and (t.school_scope='' or lower(trim(p.school))=lower(trim(t.school_scope)))
    and (t.municipality_scope='' or lower(trim(p.municipality))=lower(trim(t.municipality_scope))) limit 1;
  if pid is null then raise exception 'Jugador no trobat'; end if;

  select jsonb_build_object(
    'player',(select jsonb_build_object('code',p.public_code,'alias',p.alias,'grade',p.grade,'xp',p.xp,'points',p.points,'dailyStreak',p.daily_streak,'dailyCompleted',p.daily_completed,'adaptive',coalesce(p.client_state->'adaptive','{}'::jsonb),'seenCount',jsonb_array_length(coalesce(p.client_state->'seen','[]'::jsonb))) from public.players p where p.id=pid),
    'summary',(select jsonb_build_object('sessions',count(distinct s.id),'attempts',count(a.id),'perfect',count(a.id) filter(where a.perfect),'accuracy',case when count(a.id)>0 then round(100.0*count(a.id) filter(where a.perfect)/count(a.id),1) else 0 end,'lastActivity',max(s.created_at)) from public.sessions s left join public.attempts a on a.session_id=s.id where s.player_id=pid and s.created_at>=cutoff),
    'errors',coalesce((select jsonb_agg(jsonb_build_object('wordId',x.word_id,'errors',x.errors) order by x.errors desc,x.word_id) from (select a.word_id,count(*)::int errors from public.attempts a where a.player_id=pid and a.created_at>=cutoff and not a.perfect group by a.word_id order by errors desc limit 15) x),'[]'::jsonb),
    'challengeTypes',coalesce((select jsonb_agg(jsonb_build_object('type',x.challenge_type,'attempts',x.attempts,'errors',x.errors,'accuracy',case when x.attempts>0 then round(100.0*(x.attempts-x.errors)/x.attempts,1) else 0 end) order by x.challenge_type) from (select a.challenge_type::text challenge_type,count(*)::int attempts,count(*) filter(where not a.perfect)::int errors from public.attempts a where a.player_id=pid and a.created_at>=cutoff group by a.challenge_type) x),'[]'::jsonb),
    'recentSessions',coalesce((select jsonb_agg(jsonb_build_object('mode',x.mode,'attempts',x.attempt_count,'perfect',x.perfect_count,'xp',x.xp_awarded,'points',x.points_awarded,'date',x.created_at) order by x.created_at desc) from (select s.* from public.sessions s where s.player_id=pid order by s.created_at desc limit 20) x),'[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.defineix_teacher_issue_session(uuid) from public,anon,authenticated;
revoke all on function public.defineix_teacher_from_token(text) from public,anon,authenticated;
revoke all on function public.setup_defineix_teacher(text,text) from public,anon,authenticated;
revoke all on function public.login_defineix_teacher(text,text) from public,anon,authenticated;
revoke all on function public.logout_defineix_teacher(text) from public,anon,authenticated;
revoke all on function public.get_defineix_teacher_dashboard(text,smallint,integer) from public,anon,authenticated;
revoke all on function public.get_defineix_teacher_player(text,text,integer) from public,anon,authenticated;

grant execute on function public.setup_defineix_teacher(text,text) to anon,authenticated;
grant execute on function public.login_defineix_teacher(text,text) to anon,authenticated;
grant execute on function public.logout_defineix_teacher(text) to anon,authenticated;
grant execute on function public.get_defineix_teacher_dashboard(text,smallint,integer) to anon,authenticated;
grant execute on function public.get_defineix_teacher_player(text,text,integer) to anon,authenticated;

-- El compte de mestre i el token de configuració inicial es creen fora de la migració,
-- perquè són dades específiques de cada desplegament i no s'han de versionar al repositori.
