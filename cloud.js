(() => {
  'use strict';

  const API = window.Defineix;
  const DATA = window.DEFINEIX_DATA || [];
  const APP = document.getElementById('app');
  if (!API || !APP) return;

  const SUPABASE_URL = 'https://slxckbstxjfyuobpicpu.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_pv-5K4pgind4FUyTKi82nA_UgbKcdtH';
  const DB_KEY = 'defineix_v01';
  const ROTATION_KEY = 'defineix_rotation_v2';
  const LEGACY_RECENT_KEY = 'defineix_recent_words_v1';
  const QUEUE_KEY = 'defineix_cloud_queue_v1';
  const WELCOME_KEY = 'defineix_cloud_welcome_v1';
  const CLOUD_VERSION = 1;

  let currentRun = null;
  let migrating = false;
  let enhancing = false;
  let leaderboardLoading = false;
  let leaderboardFilter = 'general';
  let leaderboardPeriod = null;
  let welcomeData = readJSONSession(WELCOME_KEY);

  const original = {
    createProfile: API.createProfile,
    recoverProfile: API.recoverProfile,
    startPlay: API.startPlay,
    startDaily: API.startDaily,
    startTraining: API.startTraining,
    startErrors: API.startErrors,
    finishCurrent: API.finishCurrent,
    quitSession: API.quitSession,
    logout: API.logout,
    go: API.go
  };

  function readJSON(key){
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch(e){ return null; }
  }
  function writeJSON(key,value){
    try { localStorage.setItem(key,JSON.stringify(value)); return true; }
    catch(e){ return false; }
  }
  function readJSONSession(key){
    try { return JSON.parse(sessionStorage.getItem(key)) || null; }
    catch(e){ return null; }
  }
  function writeJSONSession(key,value){
    try { sessionStorage.setItem(key,JSON.stringify(value)); }
    catch(e){}
  }
  function removeSession(key){ try { sessionStorage.removeItem(key); } catch(e){} }
  function db(){
    const value=readJSON(DB_KEY);
    return value && value.profiles ? value : {profiles:{},activeCode:null};
  }
  function saveDB(value){ writeJSON(DB_KEY,value); }
  function activePack(){
    const value=db(), code=value.activeCode, profile=code && value.profiles[code];
    return profile ? {db:value,code,profile} : null;
  }
  function clean(value){ return String(value || '').trim().replace(/\s+/g,' '); }
  function esc(value){ return String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function gradeLabel(grade){ return ({1:'1r',2:'2n',3:'3r',4:'4t',5:'5è',6:'6è'})[Number(grade)] || String(grade); }
  function cycleCode(grade){ return Number(grade)<=2?'ci':Number(grade)<=4?'cm':'cs'; }
  function cloudLinked(p){ return Boolean(p?.cloud?.deviceToken); }
  function legacyFor(p){
    return p?.cloud?.legacy || {xp:0,points:0,dailyCompleted:0};
  }

  async function rpc(name,payload={}){
    const response=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY},
      body:JSON.stringify(payload)
    });
    let data=null;
    try { data=await response.json(); } catch(e){}
    if(!response.ok){
      const message=data?.message || data?.hint || `Error de connexió (${response.status})`;
      const error=new Error(message); error.status=response.status; throw error;
    }
    return data;
  }

  function rotationFor(code){
    const store=readJSON(ROTATION_KEY) || {};
    return store[code] || {};
  }
  function moveLocalAuxState(oldCode,newCode){
    if(!oldCode || oldCode===newCode) return;
    const rotation=readJSON(ROTATION_KEY) || {};
    if(rotation[oldCode]){
      rotation[newCode]=rotation[oldCode]; delete rotation[oldCode]; writeJSON(ROTATION_KEY,rotation);
    }
    const recent=readJSON(LEGACY_RECENT_KEY) || {};
    if(recent[oldCode]){
      recent[newCode]=recent[oldCode]; delete recent[oldCode]; writeJSON(LEGACY_RECENT_KEY,recent);
    }
  }
  function restoreRotation(code,rotation){
    if(!rotation || typeof rotation!=='object') return;
    const store=readJSON(ROTATION_KEY) || {};
    store[code]=rotation;
    writeJSON(ROTATION_KEY,store);
  }

  function stateSnapshot(p){
    return {
      version:CLOUD_VERSION,
      seen:Array.isArray(p.seen)?p.seen:[],
      errors:p.errors && typeof p.errors==='object'?p.errors:{},
      stats:p.stats && typeof p.stats==='object'?p.stats:{},
      adaptive:p.adaptive && typeof p.adaptive==='object'?p.adaptive:{},
      dailySet:p.dailySet || null,
      rotation:rotationFor(p.code),
      legacy:legacyFor(p)
    };
  }

  function baseProfileFromRemote(row,deviceToken,state={}){
    const legacy=state?.legacy && typeof state.legacy==='object' ? state.legacy : {xp:0,points:0,dailyCompleted:0};
    const stats=state?.stats && typeof state.stats==='object' ? state.stats : {};
    stats.correct=Number(stats.correct)||0;
    stats.total=Number(stats.total)||0;
    stats.games=Number(stats.games)||0;
    stats.dailyCompleted=Math.max(Number(stats.dailyCompleted)||0,(Number(legacy.dailyCompleted)||0)+(Number(row.daily_completed)||0));
    stats.dailyStreak=Number(stats.dailyStreak)||Number(row.daily_streak)||0;
    stats.bestDailyStreak=Math.max(Number(stats.bestDailyStreak)||0,stats.dailyStreak);
    return {
      code:row.public_code,
      alias:row.alias,
      grade:Number(row.grade),
      school:row.school || '',
      city:row.municipality || '',
      xp:(Number(legacy.xp)||0)+(Number(row.xp)||0),
      points:(Number(legacy.points)||0)+(Number(row.points)||0),
      seen:Array.isArray(state?.seen)?state.seen:[],
      errors:state?.errors && typeof state.errors==='object'?state.errors:{},
      adaptive:state?.adaptive && typeof state.adaptive==='object'?state.adaptive:{},
      dailySet:state?.dailySet || null,
      stats,
      createdAt:new Date().toISOString(),
      cloud:{
        linked:true,
        playerId:row.player_id,
        deviceToken,
        legacy,
        linkedAt:new Date().toISOString()
      }
    };
  }

  async function syncState(profile){
    if(!cloudLinked(profile)) return false;
    try{
      await rpc('sync_defineix_state',{p_device_token:profile.cloud.deviceToken,p_state:stateSnapshot(profile)});
      return true;
    }catch(e){ return false; }
  }

  function formMessage(form,html,good=false){
    let node=form.querySelector('.cloud-form-msg');
    if(!node){ node=document.createElement('div'); node.className='cloud-form-msg field full'; form.appendChild(node); }
    node.innerHTML=`<div class="feedback ${good?'good':'bad'}">${html}</div>`;
  }
  function setFormBusy(form,busy){
    form.querySelectorAll('button,input,select').forEach(el=>el.disabled=busy);
  }

  async function createCloudProfile(event){
    event.preventDefault();
    const form=event.target, f=new FormData(form);
    const alias=clean(f.get('alias')), grade=Number(f.get('grade')), school=clean(f.get('school')), city=clean(f.get('city'));
    if(alias.length<2 || alias.length>18 || !grade || !school || !city) return;
    setFormBusy(form,true);
    try{
      const rows=await rpc('register_defineix_player',{p_alias:alias,p_grade:grade,p_school:school,p_municipality:city});
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row?.device_token) throw new Error('No s’ha pogut crear el perfil al núvol.');
      const value=db();
      const profile=baseProfileFromRemote(row,row.device_token,{legacy:{xp:0,points:0,dailyCompleted:0}});
      value.profiles[row.public_code]=profile; value.activeCode=row.public_code; saveDB(value);
      await syncState(profile);
      welcomeData={code:row.public_code,recoveryCode:row.recovery_code};
      writeJSONSession(WELCOME_KEY,welcomeData);
      location.reload();
    }catch(e){
      formMessage(form,'No s’ha pogut connectar amb el núvol. El perfil es crearà localment i DEFINEIX! intentarà vincular-lo més endavant.');
      setFormBusy(form,false);
      if(typeof original.createProfile==='function'){
        original.createProfile.call(API,event);
        setTimeout(autoMigrateActive,1200);
      }
    }
  }

  async function recoverCloudProfile(event){
    event.preventDefault();
    const form=event.target, code=clean(new FormData(form).get('code')).toUpperCase();
    if(!code) return;

    const local=db();
    if(local.profiles[code]){
      local.activeCode=code; saveDB(local); location.reload(); return;
    }

    if(code.length<20){
      formMessage(form,'Aquest codi curt és el codi públic del jugador. En un dispositiu nou necessites el <strong>codi llarg de recuperació</strong>.');
      return;
    }

    setFormBusy(form,true);
    try{
      const rows=await rpc('recover_defineix_player',{p_recovery_code:code});
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row?.device_token) throw new Error('Codi no trobat');
      const state=row.client_state && typeof row.client_state==='object'?row.client_state:{};
      const profile=baseProfileFromRemote(row,row.device_token,state);
      const value=db();
      value.profiles[row.public_code]=profile; value.activeCode=row.public_code; saveDB(value);
      restoreRotation(row.public_code,state.rotation);
      location.reload();
    }catch(e){
      setFormBusy(form,false);
      formMessage(form,'No s’ha pogut recuperar el jugador. Revisa el codi de recuperació i torna-ho a provar.');
    }
  }

  async function autoMigrateActive(){
    if(migrating) return;
    const active=activePack();
    if(!active || cloudLinked(active.profile)) return;
    migrating=true;
    const oldCode=active.code, p=active.profile;
    try{
      const rows=await rpc('register_defineix_player',{p_alias:p.alias,p_grade:Number(p.grade),p_school:p.school||'',p_municipality:p.city||''});
      const row=Array.isArray(rows)?rows[0]:null;
      if(!row?.device_token) throw new Error('No cloud profile');
      const legacy={xp:Number(p.xp)||0,points:Number(p.points)||0,dailyCompleted:Number(p.stats?.dailyCompleted)||0};
      moveLocalAuxState(oldCode,row.public_code);
      p.code=row.public_code;
      p.cloud={linked:true,playerId:row.player_id,deviceToken:row.device_token,legacy,linkedAt:new Date().toISOString()};
      delete active.db.profiles[oldCode]; active.db.profiles[row.public_code]=p; active.db.activeCode=row.public_code; saveDB(active.db);
      await syncState(p);
      welcomeData={code:row.public_code,recoveryCode:row.recovery_code,migrated:true};
      writeJSONSession(WELCOME_KEY,welcomeData);
      location.reload();
    }catch(e){
      // El joc local continua sent funcional. Ho tornarem a provar en una càrrega posterior.
    }finally{ migrating=false; }
  }

  function pendingQueue(){ const q=readJSON(QUEUE_KEY); return Array.isArray(q)?q:[]; }
  function saveQueue(q){ writeJSON(QUEUE_KEY,q.slice(-30)); }
  function queueSession(item){
    const q=pendingQueue();
    if(!q.some(x=>x.sessionId===item.sessionId)) q.push(item);
    saveQueue(q);
  }

  async function processQueue(){
    const queue=pendingQueue(); if(!queue.length) return;
    const remaining=[];
    for(const item of queue){
      const value=db(), p=value.profiles?.[item.profileCode];
      if(!p?.cloud?.deviceToken) { remaining.push(item); continue; }
      try{
        await rpc('submit_defineix_session',{
          p_device_token:p.cloud.deviceToken,
          p_client_session_id:item.sessionId,
          p_mode:item.mode,
          p_attempts:item.attempts
        });
        await rpc('sync_defineix_state',{p_device_token:p.cloud.deviceToken,p_state:item.state || stateSnapshot(p)});
      }catch(e){ remaining.push(item); }
    }
    saveQueue(remaining);
  }

  async function refreshActiveProfile(){
    const active=activePack(); if(!active || !cloudLinked(active.profile)) return;
    if(pendingQueue().some(x=>x.profileCode===active.code)) return;
    try{
      const rows=await rpc('get_defineix_profile',{p_device_token:active.profile.cloud.deviceToken});
      const row=Array.isArray(rows)?rows[0]:null; if(!row) return;
      const remoteState=row.client_state && typeof row.client_state==='object'?row.client_state:{};
      const legacy=remoteState.legacy || active.profile.cloud.legacy || {xp:0,points:0,dailyCompleted:0};
      const p=active.profile;
      p.alias=row.alias; p.grade=Number(row.grade); p.school=row.school||''; p.city=row.municipality||'';
      p.xp=(Number(legacy.xp)||0)+(Number(row.xp)||0);
      p.points=(Number(legacy.points)||0)+(Number(row.points)||0);
      if(Array.isArray(remoteState.seen)) p.seen=remoteState.seen;
      if(remoteState.errors && typeof remoteState.errors==='object') p.errors=remoteState.errors;
      if(remoteState.adaptive && typeof remoteState.adaptive==='object') p.adaptive=remoteState.adaptive;
      if(remoteState.stats && typeof remoteState.stats==='object') p.stats=remoteState.stats;
      if('dailySet' in remoteState) p.dailySet=remoteState.dailySet;
      p.stats=p.stats||{};
      p.stats.dailyCompleted=Math.max(Number(p.stats.dailyCompleted)||0,(Number(legacy.dailyCompleted)||0)+(Number(row.daily_completed)||0));
      p.stats.dailyStreak=Math.max(Number(p.stats.dailyStreak)||0,Number(row.daily_streak)||0);
      p.stats.bestDailyStreak=Math.max(Number(p.stats.bestDailyStreak)||0,p.stats.dailyStreak||0);
      p.cloud.legacy=legacy;
      saveDB(active.db);
      restoreRotation(p.code,remoteState.rotation);
    }catch(e){}
  }

  function beginRun(mode,expected){
    const active=activePack();
    currentRun=active && cloudLinked(active.profile) ? {
      mode, expected, attempts:[], sent:false,
      sessionId:(crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      profileCode:active.code
    } : null;
  }
  function typeFromDOM(){
    const text=(APP.querySelector('.word-kicker')?.textContent||'').toLowerCase();
    if(text.includes('construeix')) return 'build';
    if(text.includes('ordena')) return 'order';
    if(text.includes('falta')) return 'missing';
    if(text.includes('sobra')) return 'surplus';
    return null;
  }
  function effectiveDifficulty(entry,type){
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    const concept=clamp(Number(entry?.conceptDifficulty)||3,1,5);
    const definition=clamp(Number(entry?.definitionDifficulty)||concept,1,5);
    const weighted=type==='surplus'?concept*.55+definition*.45:concept*.35+definition*.65;
    return clamp(Math.round(weighted),1,5);
  }
  function captureAttempt(){
    if(!currentRun || currentRun.sent) return;
    const word=clean(APP.querySelector('.game-card .word-title')?.textContent);
    const type=typeFromDOM();
    const active=activePack();
    if(!word || !type || !active) return;
    const entry=DATA.find(e=>e.word===word && Array.isArray(e.grades) && e.grades.includes(Number(active.profile.grade)));
    if(!entry) return;
    if(currentRun.attempts.some(a=>a.wordId===entry.id)) return;
    const label=(APP.querySelector('.complete-label')?.textContent||'').toLowerCase();
    const perfect=label.includes('definició completa') || label.includes('definicio completa');
    currentRun.attempts.push({wordId:entry.id,type,difficulty:effectiveDifficulty(entry,type),perfect});
  }

  async function submitRun(run){
    if(!run || run.sent || run.attempts.length!==run.expected) return;
    run.sent=true;
    const value=db(), p=value.profiles?.[run.profileCode];
    if(!p?.cloud?.deviceToken) return;
    const item={profileCode:run.profileCode,sessionId:run.sessionId,mode:run.mode,attempts:run.attempts,state:stateSnapshot(p)};
    try{
      await rpc('submit_defineix_session',{
        p_device_token:p.cloud.deviceToken,
        p_client_session_id:run.sessionId,
        p_mode:run.mode,
        p_attempts:run.attempts
      });
      const latest=db().profiles?.[run.profileCode] || p;
      await syncState(latest);
    }catch(e){
      queueSession(item);
    }
  }

  API.createProfile=createCloudProfile;
  API.recoverProfile=recoverCloudProfile;
  API.startPlay=function(...args){ beginRun('play',10); return original.startPlay.apply(this,args); };
  API.startDaily=function(...args){ beginRun('daily',3); return original.startDaily.apply(this,args); };
  API.startTraining=function(...args){ beginRun('training',8); return original.startTraining.apply(this,args); };
  API.startErrors=function(...args){ beginRun('training',8); return original.startErrors.apply(this,args); };
  API.finishCurrent=function(...args){
    captureAttempt();
    const run=currentRun;
    const result=original.finishCurrent.apply(this,args);
    if(run && run.attempts.length===run.expected) setTimeout(()=>submitRun(run),0);
    return result;
  };
  API.quitSession=function(...args){ currentRun=null; return original.quitSession.apply(this,args); };
  API.logout=function(...args){ currentRun=null; return original.logout.apply(this,args); };
  API.go=function(route,...args){
    const result=original.go.call(this,route,...args);
    if(route==='leaderboard') setTimeout(enhanceLeaderboard,0);
    return result;
  };

  API.cloudDismissWelcome=function(){ welcomeData=null; removeSession(WELCOME_KEY); enhance(); };
  API.cloudRotateRecovery=async function(){
    const active=activePack(); if(!active?.profile?.cloud?.deviceToken) return;
    if(!confirm('Vols generar un codi de recuperació nou? L’anterior deixarà de funcionar.')) return;
    const box=document.querySelector('.cloud-recovery-result');
    try{
      const code=await rpc('rotate_defineix_recovery',{p_device_token:active.profile.cloud.deviceToken});
      if(box) box.innerHTML=`<strong>Nou codi de recuperació</strong><div class="cloud-recovery-code">${esc(code)}</div><small>Guarda’l en un lloc segur. Aquest substitueix l’anterior.</small>`;
    }catch(e){ if(box) box.textContent='No s’ha pogut generar el codi. Torna-ho a provar.'; }
  };

  async function loadLeaderboard(filter=leaderboardFilter,period=leaderboardPeriod){
    if(leaderboardLoading) return;
    const active=activePack(); const host=document.querySelector('.cloud-ranking-results');
    if(!active || !host) return;
    leaderboardLoading=true; host.innerHTML='<div class="cloud-loading">Carregant classificació…</div>';
    const p=active.profile;
    const args={p_metric:filter==='daily'?'daily':'points',p_season_slug:period||null,p_grade:null,p_cycle:null,p_school:null,p_municipality:null,p_limit:50};
    if(filter==='grade') args.p_grade=Number(p.grade);
    if(filter==='cycle') args.p_cycle=cycleCode(p.grade);
    if(filter==='school') args.p_school=p.school||null;
    if(filter==='municipality') args.p_municipality=p.city||null;
    try{
      const rows=await rpc('get_defineix_leaderboard',args);
      if(!Array.isArray(rows) || !rows.length){ host.innerHTML='<div class="notice">Encara no hi ha resultats en aquesta classificació.</div>'; }
      else{
        host.innerHTML=`<div class="cloud-ranking-list">${rows.map(r=>`<div class="cloud-ranking-row ${r.alias===p.alias && Number(r.grade)===Number(p.grade)?'is-me':''}"><span class="cloud-rank-pos">${Number(r.rank)<=3?['🥇','🥈','🥉'][Number(r.rank)-1]:`#${r.rank}`}</span><span class="cloud-rank-name"><strong>${esc(r.alias)}</strong><small>${gradeLabel(r.grade)}</small></span><strong class="cloud-rank-score">${Number(r.score||0).toLocaleString('ca-ES')}</strong></div>`).join('')}</div>`;
      }
    }catch(e){ host.innerHTML='<div class="feedback bad">No s’ha pogut carregar la classificació. El joc continua funcionant amb normalitat.</div>'; }
    finally{ leaderboardLoading=false; }
  }

  function enhanceRecover(){
    const input=document.getElementById('code'); if(!input || input.dataset.cloudReady) return;
    input.dataset.cloudReady='1'; input.maxLength=32; input.placeholder='XXXXX-XXXXX-XXXXX-XXXXX';
    const label=input.closest('.field')?.querySelector('label'); if(label) label.textContent='Codi de recuperació';
    const section=input.closest('.form-card');
    const intro=section?.querySelector('h1 + p'); if(intro) intro.textContent='En aquest dispositiu també pots utilitzar un codi públic que ja hi estigui desat. En un dispositiu nou, escriu el codi llarg de recuperació.';
    const notice=section?.querySelector('.notice');
    if(notice) notice.innerHTML='<strong>☁️ Perfils al núvol actius.</strong> El codi públic identifica el jugador; el codi llarg de recuperació és el que permet entrar de manera segura des d’un dispositiu nou.';
  }

  function enhanceProfile(){
    const code=document.querySelector('.profile-code'); if(!code) return;
    const panel=code.closest('.profile-panel'); if(!panel || panel.dataset.cloudReady) return;
    const active=activePack(); if(!active || !cloudLinked(active.profile)) return;
    panel.dataset.cloudReady='1';
    const notice=panel.querySelector('.notice');
    if(notice) notice.innerHTML='☁️ <strong>Perfil sincronitzat.</strong> Aquest és el teu codi públic. Per entrar des d’un dispositiu nou utilitza un codi de recuperació.';
    const box=document.createElement('div'); box.className='cloud-profile-actions';
    box.innerHTML='<button class="btn btn-soft" onclick="Defineix.cloudRotateRecovery()">🔐 Genera un codi de recuperació nou</button><div class="cloud-recovery-result"></div>';
    panel.appendChild(box);
  }

  function enhanceDashboard(){
    const section=document.querySelector('.screen');
    const head=section?.querySelector('.section-head');
    if(!head || !activePack()) return;
    if(welcomeData && !section.querySelector('.cloud-welcome-banner')){
      const banner=document.createElement('div'); banner.className='welcome-banner cloud-welcome-banner';
      banner.innerHTML=`<div><span class="eyebrow">☁️ ${welcomeData.migrated?'Perfil vinculat al núvol':'Perfil creat al núvol'}</span><strong>Codi públic: <span>${esc(welcomeData.code)}</span></strong><small>El teu codi de recuperació és:</small><div class="cloud-recovery-code">${esc(welcomeData.recoveryCode)}</div><small>Guarda aquest codi llarg. És el que et permet entrar des d’un altre dispositiu.</small></div><button class="btn btn-primary" onclick="Defineix.cloudDismissWelcome()">Ja l’he guardat</button>`;
      section.insertBefore(banner,head);
    }
  }

  function enhanceLeaderboard(){
    const placeholder=document.querySelector('.leader-placeholder');
    if(!placeholder || placeholder.dataset.cloudReady) return;
    const active=activePack(); if(!active) return;
    placeholder.dataset.cloudReady='1';
    placeholder.innerHTML=`<div class="cloud-leaderboard"><div class="cloud-rank-controls"><div class="cloud-rank-tabs">
      <button data-filter="general">General</button><button data-filter="grade">${gradeLabel(active.profile.grade)}</button><button data-filter="cycle">Cicle</button><button data-filter="school">Escola</button><button data-filter="municipality">Municipi</button><button data-filter="daily">📅 Diaris</button>
      </div><label class="cloud-period">Període <select><option value="">Global</option><option value="curs-2026-27">Curs 2026-27</option><option value="1r-trimestre-2026-27">1r trimestre</option></select></label></div><div class="cloud-ranking-results"></div></div>`;
    const tabs=[...placeholder.querySelectorAll('[data-filter]')];
    const select=placeholder.querySelector('select');
    const selectTab=(filter)=>{ leaderboardFilter=filter; tabs.forEach(b=>b.classList.toggle('active',b.dataset.filter===filter)); loadLeaderboard(filter,leaderboardPeriod); };
    tabs.forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.filter)));
    select.addEventListener('change',()=>{leaderboardPeriod=select.value||null;loadLeaderboard(leaderboardFilter,leaderboardPeriod);});
    selectTab(leaderboardFilter);
  }

  function enhance(){
    if(enhancing) return; enhancing=true;
    try{
      enhanceRecover(); enhanceProfile(); enhanceDashboard(); enhanceLeaderboard();
    }finally{ enhancing=false; }
  }

  const observer=new MutationObserver(()=>queueMicrotask(enhance));
  observer.observe(APP,{childList:true,subtree:true});
  enhance();

  (async()=>{
    await processQueue();
    await refreshActiveProfile();
    await autoMigrateActive();
    enhance();
  })();
})();
