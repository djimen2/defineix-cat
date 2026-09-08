-- DEFINEIX! · El repte diari pot repetir-se i només premia la primera superació del dia.
-- Manté els XP de pràctica de cada intent i suma 40 XP només quan es supera per primer cop.

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
  pid uuid; player_grade smallint; mode_value public.defineix_mode; required_attempts integer;
  attempt_total integer; distinct_words integer; item jsonb; ctype public.defineix_challenge_type;
  wordid text; diff smallint; isperfect boolean; row_xp integer; row_points integer;
  sum_xp integer := 0; sum_points integer := 0; perfect_total integer := 0; streak integer := 0;
  sid uuid; existing public.sessions%rowtype; local_date date := (now() at time zone 'Europe/Madrid')::date;
  daily_ok boolean := false; daily_was_completed boolean := false; daily_new_success boolean := false;
  s public.seasons%rowtype;
begin
  pid := public.defineix_player_from_token(p_device_token);
  if pid is null then raise exception 'Sessió no vàlida'; end if;
  if p_client_session_id is null or char_length(trim(p_client_session_id)) < 8 or char_length(trim(p_client_session_id)) > 120 then raise exception 'Identificador de partida invàlid'; end if;

  select * into existing from public.sessions where player_id = pid and client_session_id = trim(p_client_session_id);
  if found then
    return query select existing.id, existing.xp_awarded, existing.points_awarded,
      p.xp, p.points, p.daily_streak, p.daily_completed, coalesce(dr.completed,false)
    from public.players p left join public.daily_results dr on dr.player_id=p.id and dr.challenge_date=local_date
    where p.id=pid;
    return;
  end if;

  begin mode_value := p_mode::public.defineix_mode; exception when others then raise exception 'Mode invàlid'; end;
  if jsonb_typeof(p_attempts) <> 'array' then raise exception 'Intents invàlids'; end if;
  attempt_total := jsonb_array_length(p_attempts);
  required_attempts := case mode_value when 'play' then 10 when 'training' then 8 else 3 end;
  if attempt_total <> required_attempts then raise exception 'Nombre d’intents invàlid: se n’esperaven %', required_attempts; end if;
  select count(distinct value->>'wordId')::integer into distinct_words from jsonb_array_elements(p_attempts);
  if distinct_words <> attempt_total then raise exception 'No es permet repetir una paraula dins la mateixa partida'; end if;

  if mode_value='daily' then
    select coalesce(max(completed::int),0)=1 into daily_was_completed
    from public.daily_results where player_id=pid and challenge_date=local_date;
  end if;

  select grade into player_grade from public.players where id=pid;
  insert into public.sessions(player_id,client_session_id,mode) values(pid,trim(p_client_session_id),mode_value) returning id into sid;

  for item in select value from jsonb_array_elements(p_attempts) loop
    begin ctype := (item->>'type')::public.defineix_challenge_type; exception when others then raise exception 'Tipus de repte invàlid'; end;
    wordid := left(coalesce(item->>'wordId',''),120); if char_length(wordid)<1 then raise exception 'Paraula invàlida'; end if;
    begin diff := (item->>'difficulty')::smallint; exception when others then raise exception 'Dificultat invàlida'; end;
    if diff<1 or diff>5 then raise exception 'Dificultat invàlida'; end if;
    begin isperfect := (item->>'perfect')::boolean; exception when others then raise exception 'Resultat invàlid'; end;
    if isperfect is null then raise exception 'Resultat invàlid'; end if;

    if isperfect then
      streak:=streak+1; perfect_total:=perfect_total+1;
      if mode_value='training' then row_xp:=8+diff*2; row_points:=0;
      elsif mode_value='daily' then row_xp:=15+diff*3; row_points:=0;
      else row_xp:=14+diff*3+player_grade; row_points:=70+diff*30+player_grade*5+least(streak,5)*10; end if;
    else streak:=0; row_xp:=3; row_points:=0; end if;
    sum_xp:=sum_xp+row_xp; sum_points:=sum_points+row_points;
    insert into public.attempts(session_id,player_id,word_id,challenge_type,difficulty,perfect,xp_awarded,points_awarded)
    values(sid,pid,wordid,ctype,diff,isperfect,row_xp,row_points);
  end loop;

  if mode_value='daily' then
    daily_ok := perfect_total>=2;
    daily_new_success := daily_ok and not daily_was_completed;
    if daily_new_success then sum_xp:=sum_xp+40; end if;
    insert into public.daily_results(player_id,challenge_date,perfect_count,completed)
    values(pid,local_date,perfect_total,daily_ok)
    on conflict(player_id,challenge_date) do update
    set perfect_count=greatest(public.daily_results.perfect_count,excluded.perfect_count),
        completed=public.daily_results.completed or excluded.completed;
  end if;

  update public.sessions set attempt_count=attempt_total,perfect_count=perfect_total,xp_awarded=sum_xp,points_awarded=sum_points where id=sid;
  update public.players p set
    xp=p.xp+sum_xp, points=p.points+sum_points,
    daily_streak=case when mode_value='daily' and daily_new_success then case when p.last_daily_date=local_date-1 then p.daily_streak+1 else 1 end else p.daily_streak end,
    daily_completed=case when mode_value='daily' and daily_new_success then p.daily_completed+1 else p.daily_completed end,
    last_daily_date=case when mode_value='daily' and daily_new_success then local_date else p.last_daily_date end,
    updated_at=now()
  where p.id=pid;

  for s in select * from public.seasons where is_visible=true and local_date between start_date and end_date loop
    insert into public.player_season_stats(player_id,season_id,xp,points,games,perfect,daily_completed)
    values(pid,s.id,sum_xp,sum_points,case when mode_value='play' then 1 else 0 end,perfect_total,case when mode_value='daily' and daily_new_success then 1 else 0 end)
    on conflict(player_id,season_id) do update set
      xp=public.player_season_stats.xp+excluded.xp,
      points=public.player_season_stats.points+excluded.points,
      games=public.player_season_stats.games+excluded.games,
      perfect=public.player_season_stats.perfect+excluded.perfect,
      daily_completed=public.player_season_stats.daily_completed+excluded.daily_completed,
      updated_at=now();
  end loop;

  return query select sid,sum_xp,sum_points,p.xp,p.points,p.daily_streak,p.daily_completed,
    case when mode_value='daily' then coalesce(dr.completed,false) else false end
  from public.players p left join public.daily_results dr on dr.player_id=p.id and dr.challenge_date=local_date where p.id=pid;
end;
$$;

revoke all on function public.submit_defineix_session(text,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_defineix_session(text,text,text,jsonb) to anon, authenticated;
