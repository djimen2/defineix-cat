(() => {
  'use strict';

  const APP = document.getElementById('teacher-app');
  if (!APP) return;

  const SUPABASE_URL = 'https://slxckbstxjfyuobpicpu.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_pv-5K4pgind4FUyTKi82nA_UgbKcdtH';
  const SESSION_KEY = 'defineix_teacher_session_v1';
  const LOGIN_KEY = 'defineix_teacher_login_v1';
  const DATA = window.DEFINEIX_DATA || [];
  const WORDS = new Map(DATA.map(entry => [entry.id, entry.word]));
  const TYPE_INFO = {
    build:{icon:'🧩',name:'Construeix'},
    order:{icon:'🔀',name:'Ordena'},
    missing:{icon:'🕳️',name:'Què hi falta?'},
    surplus:{icon:'🧹',name:'Què hi sobra?'}
  };
  const ADAPTIVE_LABELS = {1:'Pas a pas',2:'Consolidant',3:'En marxa',4:'Repte',5:'Repte+'};
  const MODE_LABELS = {play:'Jugar',training:'Entrenar',daily:'Repte del dia'};

  let auth = readJSON(SESSION_KEY);
  let gradeFilter = '';
  let daysFilter = 30;
  let currentDashboard = null;

  function readJSON(key){
    try { return JSON.parse(localStorage.getItem(key)) || null; }
    catch(e){ return null; }
  }
  function writeJSON(key,value){
    try { localStorage.setItem(key,JSON.stringify(value)); }
    catch(e){}
  }
  function removeKey(key){ try { localStorage.removeItem(key); } catch(e){} }
  function esc(value){
    return String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }
  function gradeLabel(grade){ return ({1:'1r',2:'2n',3:'3r',4:'4t',5:'5è',6:'6è'})[Number(grade)] || String(grade || ''); }
  function wordLabel(id){ return WORDS.get(id) || String(id || '').replace(/^(ci|cm|cs|bank)-/,'').replace(/-/g,' '); }
  function fmtNumber(value){ return Number(value || 0).toLocaleString('ca-ES'); }
  function fmtDate(value){
    if(!value) return 'Sense activitat';
    try { return new Intl.DateTimeFormat('ca-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value)); }
    catch(e){ return '—'; }
  }
  async function rpc(name,payload={}){
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY},
      body:JSON.stringify(payload)
    });
    let data=null;
    const text=await response.text();
    if(text){ try { data=JSON.parse(text); } catch(e){} }
    if(!response.ok){
      const error=new Error(data?.message || data?.hint || 'No s’ha pogut completar la petició.');
      error.status=response.status;
      throw error;
    }
    return data;
  }
  function saveAuth(row){
    auth={
      loginCode:row.login_code,
      token:row.session_token,
      label:row.label || 'Mestre',
      school:row.school || '',
      municipality:row.municipality || ''
    };
    writeJSON(SESSION_KEY,auth);
    writeJSON(LOGIN_KEY,{loginCode:auth.loginCode});
  }
  function clearAuth(){ auth=null; removeKey(SESSION_KEY); }
  function topbar(){
    return `<header class="tbar"><a class="brand" href="index.html"><span class="brand-mark">✦</span><span><strong>DEFINEIX!</strong><small>Vista de mestre</small></span></a>${auth?`<span class="pill">🔒 ${esc(auth.loginCode)}</span>`:''}</header>`;
  }
  function renderAuthCard(content){
    APP.innerHTML=`${topbar()}<section class="auth-wrap"><div class="panel auth-card">${content}</div></section>`;
  }
  function renderSetup(setupCode){
    renderAuthCard(`<span class="eyebrow">Configuració inicial</span><h1>Activa la vista de mestre</h1><p class="muted">Tria una contrasenya pròpia. No quedarà guardada al codi de l’aplicació i l’enllaç que estàs utilitzant deixarà de funcionar després d’aquest pas.</p><form id="setup-form" class="form"><div class="field"><label for="setup-password">Contrasenya</label><input id="setup-password" type="password" minlength="10" maxlength="128" autocomplete="new-password" required><small class="muted">Mínim 10 caràcters.</small></div><div class="field"><label for="setup-password-2">Repeteix la contrasenya</label><input id="setup-password-2" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></div><button class="btn btn-primary" type="submit">Activar accés de mestre</button><div id="auth-msg"></div></form>`);
    document.getElementById('setup-form').addEventListener('submit',event=>setupTeacher(event,setupCode));
  }
  async function setupTeacher(event,setupCode){
    event.preventDefault();
    const form=event.currentTarget, p1=document.getElementById('setup-password').value, p2=document.getElementById('setup-password-2').value, msg=document.getElementById('auth-msg');
    if(p1!==p2){ msg.innerHTML='<div class="error">Les dues contrasenyes no coincideixen.</div>'; return; }
    const button=form.querySelector('button'); button.disabled=true; msg.innerHTML='<div class="notice">Activant l’accés…</div>';
    try{
      const rows=await rpc('setup_defineix_teacher',{p_setup_token:setupCode,p_password:p1});
      const row=Array.isArray(rows)?rows[0]:rows;
      if(!row?.session_token) throw new Error('No s’ha pogut crear la sessió.');
      saveAuth(row);
      history.replaceState({},document.title,location.pathname);
      await loadDashboard();
    }catch(e){
      button.disabled=false; msg.innerHTML=`<div class="error">${esc(e.message)}</div>`;
    }
  }
  function renderLogin(message=''){
    const remembered=readJSON(LOGIN_KEY)?.loginCode || '';
    renderAuthCard(`<span class="eyebrow">Accés privat</span><h1>Vista de mestre</h1><p class="muted">Consulta el progrés i l’activitat dels jugadors de la teva escola.</p><form id="login-form" class="form"><div class="field"><label for="login-code">Codi de mestre</label><input id="login-code" value="${esc(remembered)}" autocomplete="username" required placeholder="M-XXXX-XXXX"></div><div class="field"><label for="login-password">Contrasenya</label><input id="login-password" type="password" autocomplete="current-password" required></div><button class="btn btn-primary" type="submit">Entrar</button><div id="auth-msg">${message?`<div class="error">${esc(message)}</div>`:''}</div></form><div class="notice" style="margin-top:18px">L’accés de mestre és independent dels perfils dels alumnes.</div>`);
    document.getElementById('login-form').addEventListener('submit',loginTeacher);
  }
  async function loginTeacher(event){
    event.preventDefault();
    const form=event.currentTarget, code=document.getElementById('login-code').value.trim().toUpperCase(), password=document.getElementById('login-password').value, msg=document.getElementById('auth-msg'), button=form.querySelector('button');
    button.disabled=true; msg.innerHTML='<div class="notice">Comprovant credencials…</div>';
    try{
      const rows=await rpc('login_defineix_teacher',{p_login_code:code,p_password:password});
      const row=Array.isArray(rows)?rows[0]:rows;
      if(!row?.session_token) throw new Error('Credencials incorrectes');
      saveAuth(row);
      await loadDashboard();
    }catch(e){ button.disabled=false; msg.innerHTML=`<div class="error">${esc(e.message)}</div>`; }
  }
  function renderLoading(){
    APP.innerHTML=`${topbar()}<section class="panel loading">Carregant les dades de la classe…</section>`;
  }
  function metric(label,value){ return `<div class="panel metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`; }
  function typeCard(type,row){
    const info=TYPE_INFO[type], attempts=Number(row?.attempts||0), errors=Number(row?.errors||0), accuracy=Number(row?.accuracy||0);
    return `<div class="type-card"><div class="line"><strong>${info.icon} ${info.name}</strong><span class="mini">${attempts} intents</span></div><div class="accuracy">${accuracy}%</div><div class="mini">${errors} errors</div></div>`;
  }
  function adaptiveHTML(adaptive){
    return `<div class="adaptives">${Object.keys(TYPE_INFO).map(type=>{const lvl=Number(adaptive?.[type]?.level)||3;return `<span class="adaptive-dot" title="${esc(TYPE_INFO[type].name)} · ${esc(ADAPTIVE_LABELS[lvl])}">${lvl}</span>`;}).join('')}</div>`;
  }
  function errorRows(errors){
    if(!errors?.length) return '<div class="empty">Encara no hi ha errors registrats en aquest període.</div>';
    return `<div class="error-list">${errors.map(item=>`<div class="error-row"><div><strong>${esc(wordLabel(item.wordId))}</strong><br><span>${Number(item.players||1)} jugador${Number(item.players||1)===1?'':'s'}</span></div><strong>${Number(item.errors||0)} err.</strong></div>`).join('')}</div>`;
  }
  function studentRows(players){
    if(!players?.length) return '<tr><td colspan="7"><div class="empty">Encara no hi ha jugadors amb aquest filtre.</div></td></tr>';
    return players.map(p=>`<tr data-player="${esc(p.code)}"><td class="student-name"><strong>${esc(p.alias)}</strong><small>${esc(p.code)}</small></td><td><span class="pill">${gradeLabel(p.grade)}</span></td><td>${fmtNumber(p.points)}</td><td>${Number(p.accuracy||0)}%</td><td>${Number(p.sessions||0)}</td><td>${adaptiveHTML(p.adaptive)}</td><td>${fmtDate(p.lastActivity)}</td></tr>`).join('');
  }
  function renderDashboard(data){
    currentDashboard=data;
    const s=data.summary||{}, rowsByType=new Map((data.challengeTypes||[]).map(x=>[x.type,x]));
    APP.innerHTML=`${topbar()}<section><div class="dashboard-head"><div><span class="eyebrow">📊 Seguiment</span><h1>${esc(data.teacher?.school || 'Vista de mestre')}</h1><p class="muted">${esc(data.teacher?.municipality || '')} · dades dels últims ${Number(data.periodDays||daysFilter)} dies</p></div><div class="head-actions"><button id="refresh" class="btn btn-soft">↻ Actualitza</button><button id="logout" class="btn btn-danger">Tanca sessió</button></div></div>
      <div class="panel filters"><div class="field"><label for="grade-filter">Curs</label><select id="grade-filter"><option value="">Tots</option>${[1,2,3,4,5,6].map(g=>`<option value="${g}" ${String(gradeFilter)===String(g)?'selected':''}>${gradeLabel(g)}</option>`).join('')}</select></div><div class="field"><label for="days-filter">Període</label><select id="days-filter">${[[7,'7 dies'],[30,'30 dies'],[90,'90 dies'],[365,'Tot el curs']].map(([v,l])=>`<option value="${v}" ${Number(daysFilter)===v?'selected':''}>${l}</option>`).join('')}</select></div></div>
      <div class="summary-grid">${metric('JUGADORS',s.players||0)}${metric('ACTIUS',s.activePlayers||0)}${metric('SESSIONS',s.sessions||0)}${metric('PARTIDES',s.games||0)}${metric('REPTES',s.attempts||0)}${metric('PRECISIÓ',`${Number(s.accuracy||0)}%`)}</div>
      <div class="content-grid"><div class="panel section-card"><div class="section-title"><h2>Rendiment per tipus de repte</h2><span class="mini">Precisió del període</span></div><div class="type-grid">${Object.keys(TYPE_INFO).map(type=>typeCard(type,rowsByType.get(type))).join('')}</div></div><div class="panel section-card"><div class="section-title"><h2>Paraules que costen més</h2><span class="mini">Top 20</span></div>${errorRows(data.errors||[])}</div></div>
      <div class="panel student-panel"><div class="section-title"><h2>Alumnes</h2><span class="mini">Clica un alumne per veure’n el detall</span></div><div style="overflow:auto"><table class="student-table"><thead><tr><th>Jugador</th><th>Curs</th><th>Punts</th><th>Precisió</th><th>Sessions</th><th>Adaptació</th><th>Última activitat</th></tr></thead><tbody>${studentRows(data.players||[])}</tbody></table></div></div>
    </section><div id="detail-host"></div>`;

    document.getElementById('refresh').addEventListener('click',()=>loadDashboard());
    document.getElementById('logout').addEventListener('click',logoutTeacher);
    document.getElementById('grade-filter').addEventListener('change',event=>{gradeFilter=event.target.value;loadDashboard();});
    document.getElementById('days-filter').addEventListener('change',event=>{daysFilter=Number(event.target.value)||30;loadDashboard();});
    APP.querySelectorAll('[data-player]').forEach(row=>row.addEventListener('click',()=>openPlayer(row.dataset.player)));
  }
  async function loadDashboard(){
    if(!auth?.token){ renderLogin(); return; }
    renderLoading();
    try{
      const data=await rpc('get_defineix_teacher_dashboard',{p_teacher_token:auth.token,p_grade:gradeFilter?Number(gradeFilter):null,p_days:daysFilter});
      renderDashboard(Array.isArray(data)?data[0]:data);
    }catch(e){
      if(/Sessió de mestre/i.test(e.message)){ clearAuth(); renderLogin('La sessió havia caducat. Torna a entrar.'); }
      else APP.innerHTML=`${topbar()}<section class="panel auth-card"><div class="error">${esc(e.message)}</div><div style="margin-top:14px"><button id="retry" class="btn btn-primary">Torna-ho a provar</button></div></section>`,document.getElementById('retry').addEventListener('click',()=>loadDashboard());
    }
  }
  async function openPlayer(code){
    const host=document.getElementById('detail-host'); if(!host) return;
    host.innerHTML='<div class="overlay"><div class="panel detail"><div class="loading">Carregant alumne…</div></div></div>';
    try{
      const raw=await rpc('get_defineix_teacher_player',{p_teacher_token:auth.token,p_public_code:code,p_days:Math.max(daysFilter,90)});
      const data=Array.isArray(raw)?raw[0]:raw, p=data.player||{}, s=data.summary||{}, rowsByType=new Map((data.challengeTypes||[]).map(x=>[x.type,x]));
      host.innerHTML=`<div class="overlay" id="detail-overlay"><div class="panel detail"><div class="detail-head"><div><span class="eyebrow">${gradeLabel(p.grade)} · ${esc(p.code)}</span><h2>${esc(p.alias)}</h2><p class="muted">${Number(p.seenCount||0)} paraules diferents vistes</p></div><button id="detail-close" class="close" aria-label="Tanca">×</button></div><div class="detail-summary"><div class="detail-stat"><strong>${fmtNumber(p.points)}</strong><span class="mini">Punts</span></div><div class="detail-stat"><strong>${fmtNumber(p.xp)}</strong><span class="mini">XP</span></div><div class="detail-stat"><strong>${Number(s.accuracy||0)}%</strong><span class="mini">Precisió</span></div><div class="detail-stat"><strong>${Number(p.dailyStreak||0)}</strong><span class="mini">Ratxa diària</span></div></div>
        <div class="detail-section"><h3>Dificultat adaptativa</h3><div class="type-grid">${Object.keys(TYPE_INFO).map(type=>{const lvl=Number(p.adaptive?.[type]?.level)||3;return `<div class="type-card"><strong>${TYPE_INFO[type].icon} ${TYPE_INFO[type].name}</strong><div class="accuracy">${esc(ADAPTIVE_LABELS[lvl])}</div><div class="mini">Nivell ${lvl}/5</div></div>`;}).join('')}</div></div>
        <div class="detail-section"><h3>Rendiment per activitat</h3><div class="type-grid">${Object.keys(TYPE_INFO).map(type=>typeCard(type,rowsByType.get(type))).join('')}</div></div>
        <div class="detail-section"><h3>Errors més repetits</h3>${errorRows((data.errors||[]).map(x=>({...x,players:1})))}</div>
        <div class="detail-section"><h3>Últimes sessions</h3>${recentSessions(data.recentSessions||[])}</div>
      </div></div>`;
      document.getElementById('detail-close').addEventListener('click',closeDetail);
      document.getElementById('detail-overlay').addEventListener('click',event=>{if(event.target.id==='detail-overlay')closeDetail();});
    }catch(e){ host.innerHTML=`<div class="overlay" id="detail-overlay"><div class="panel detail"><div class="error">${esc(e.message)}</div><div style="margin-top:14px"><button id="detail-close" class="btn btn-soft">Tanca</button></div></div></div>`;document.getElementById('detail-close').addEventListener('click',closeDetail); }
  }
  function recentSessions(items){
    if(!items.length) return '<div class="empty">Encara no hi ha sessions registrades.</div>';
    return `<div class="session-list">${items.map(x=>`<div class="session-row"><span><strong>${esc(MODE_LABELS[x.mode]||x.mode)}</strong><br><span class="mini">${fmtDate(x.date)}</span></span><span>${Number(x.perfect||0)}/${Number(x.attempts||0)}</span><span>+${Number(x.xp||0)} XP</span></div>`).join('')}</div>`;
  }
  function closeDetail(){ const host=document.getElementById('detail-host'); if(host) host.innerHTML=''; }
  async function logoutTeacher(){
    const token=auth?.token;
    clearAuth();
    try { if(token) await rpc('logout_defineix_teacher',{p_teacher_token:token}); } catch(e){}
    renderLogin();
  }

  const setupCode=new URLSearchParams(location.search).get('setup');
  if(setupCode){ renderSetup(setupCode); }
  else if(auth?.token){ loadDashboard(); }
  else renderLogin();
})();
