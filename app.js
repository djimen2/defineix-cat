(() => {
  'use strict';

  const DATA = window.DEFINEIX_DATA || [];
  const STORAGE_KEY = 'defineix_v01';
  const TZ = 'Europe/Madrid';
  const TYPES = ['build','order','missing','surplus'];
  const TYPE_INFO = {
    build:{icon:'🧩',name:'Construeix la definició',desc:'Tria peça a peça la informació necessària.'},
    order:{icon:'🔀',name:'Ordena-la',desc:'Col·loca cada peça a la part de la definició que li correspon.'},
    missing:{icon:'🕳️',name:'Què hi falta?',desc:'Completa la part que falta en una definició.'},
    surplus:{icon:'🧹',name:'Què hi sobra?',desc:'Detecta la informació que no és necessària per definir.'}
  };
  const ADAPTIVE_LABELS = {1:'Pas a pas',2:'Consolidant',3:'En marxa',4:'Repte',5:'Repte+'};

  let db = loadDB();
  let screen = db.activeCode && db.profiles[db.activeCode] ? 'dashboard' : 'landing';
  let session = null;
  let challengeState = null;
  let transitionTimer = null;
  let welcomeCode = null;
  const app = document.getElementById('app');

  function loadDB(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(parsed && parsed.profiles) return parsed;
    }catch(e){}
    return {profiles:{},activeCode:null};
  }
  function saveDB(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  function profile(){
    const p=db.activeCode ? db.profiles[db.activeCode] : null;
    if(p) ensureProfile(p);
    return p;
  }
  function esc(value){ return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function spaces(v){ return String(v || '').trim().replace(/\s+/g,' '); }
  function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
  function shuffle(arr, rnd=Math.random){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }
  function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
  function mulberry32(seed){ return function(){let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;}; }
  function today(){ return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
  function daysBetween(a,b){
    if(!a||!b) return Infinity;
    const [ay,am,ad]=a.split('-').map(Number), [by,bm,bd]=b.split('-').map(Number);
    return Math.round((Date.UTC(by,bm-1,bd)-Date.UTC(ay,am-1,ad))/86400000);
  }
  function generateCode(){
    const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    do{
      let raw='';
      for(let i=0;i<8;i++) raw += chars[Math.floor(Math.random()*chars.length)];
      code=raw.slice(0,4)+'-'+raw.slice(4);
    }while(db.profiles[code]);
    return code;
  }
  function levelFor(xp){ return Math.floor((xp || 0)/500)+1; }
  function xpIntoLevel(xp){ return (xp || 0)%500; }
  function cycleName(grade){ return grade<=2?'Cicle inicial':grade<=4?'Cicle mitjà':'Cicle superior'; }
  function gradeLabel(grade){ return ({1:'1r',2:'2n',3:'3r',4:'4t',5:'5è',6:'6è'})[Number(grade)] || `${grade}è`; }
  function clearTransition(){ if(transitionTimer){clearTimeout(transitionTimer);transitionTimer=null;} }

  function ensureProfile(p){
    p.seen=Array.isArray(p.seen)?p.seen:[];
    p.errors=p.errors||{};
    p.stats=p.stats||{};
    p.stats.correct=p.stats.correct||0;
    p.stats.total=p.stats.total||0;
    p.stats.games=p.stats.games||0;
    p.stats.dailyCompleted=p.stats.dailyCompleted||0;
    p.stats.dailyStreak=p.stats.dailyStreak||0;
    p.stats.bestDailyStreak=p.stats.bestDailyStreak||0;
    p.adaptive=p.adaptive||{};
    for(const type of TYPES){
      const current=p.adaptive[type]||{};
      p.adaptive[type]={
        level:clamp(Number(current.level)||3,1,5),
        history:Array.isArray(current.history)?current.history.slice(-20):[],
        sinceChange:Number(current.sinceChange)||0,
        total:Number(current.total)||0,
        perfect:Number(current.perfect)||0,
        lastChange:current.lastChange||null
      };
    }
    p.dailySet=p.dailySet||null;
    return p;
  }
  Object.values(db.profiles||{}).forEach(ensureProfile);
  saveDB();

  function adaptiveLabel(level){ return ADAPTIVE_LABELS[clamp(Number(level)||3,1,5)]; }
  function adaptiveState(p,type){ ensureProfile(p); return p.adaptive[type]; }
  function entryDifficulty(entry,type){
    const concept=clamp(Number(entry.conceptDifficulty)||3,1,5);
    const definition=clamp(Number(entry.definitionDifficulty)||concept,1,5);
    const weighted=type==='surplus' ? concept*.55+definition*.45 : concept*.35+definition*.65;
    return clamp(Math.round(weighted),1,5);
  }
  function recordAdaptive(p,type,performance){
    const state=adaptiveState(p,type), value=clamp(Number(performance)||0,0,1);
    state.history.push(value); if(state.history.length>20) state.history.shift();
    state.sinceChange++; state.total++; if(value>=.999) state.perfect++;
    let change=null;
    if(state.level>1 && state.sinceChange>=10){
      const recent=state.history.slice(-10);
      if(recent.length===10 && recent.reduce((a,b)=>a+b,0)/10<=.55){
        change={type,from:state.level,to:state.level-1}; state.level--;
      }
    }
    if(!change && state.level<5 && state.sinceChange>=15){
      const recent=state.history.slice(-15);
      if(recent.length===15 && recent.reduce((a,b)=>a+b,0)/15>=.85){
        change={type,from:state.level,to:state.level+1}; state.level++;
      }
    }
    if(change){ state.history=[]; state.sinceChange=0; state.lastChange=today(); }
    return change;
  }

  function topbar(showPlayer=true, compact=false){
    const p=profile();
    return `<header class="topbar ${compact?'compact':''}">
      <button class="brand small-link" onclick="Defineix.go('${p?'dashboard':'landing'}')" aria-label="Anar al menú principal">
        <span class="brand-mark">✦</span>
        <span><span class="brand-title">DEFINEIX!</span><span class="brand-sub">Construeix significats</span></span>
      </button>
      ${showPlayer && p ? `<button class="player-chip" onclick="Defineix.go('profile')">
        <span class="player-avatar">${esc(p.alias).slice(0,1).toUpperCase()}</span>
        <span class="player-meta"><strong>${esc(p.alias)}</strong><br><small>${gradeLabel(p.grade)} · Nivell ${levelFor(p.xp)}</small></span>
      </button>`:''}
    </header>`;
  }

  function render(){
    app.classList.toggle('game-mode',screen==='game');
    const routes={landing:renderLanding,create:renderCreate,recover:renderRecover,dashboard:renderDashboard,training:renderTraining,profile:renderProfile,leaderboard:renderLeaderboard,game:renderGame,results:renderResults};
    (routes[screen] || renderLanding)();
    if(screen!=='game') window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderLanding(){
    app.innerHTML = `${topbar(false)}<section class="screen hero hero-single">
      <div class="panel hero-copy">
        <span class="eyebrow">🧠 Joc de vocabulari en català</span>
        <h1>Aprèn a <span>definir.</span></h1>
        <p>No tradueixis la paraula: pensa què és, què la caracteritza i quina informació és realment important. Construeix definicions cada vegada més precises.</p>
        <div class="definition-roadmap" aria-label="Passos per fer una bona definició">
          <span><b>1</b> Què és?</span><span><b>2</b> Com és o què fa?</span><span><b>3</b> Què la distingeix?</span>
        </div>
        <div class="actions">
          <button class="btn btn-primary" onclick="Defineix.go('create')">✨ Crea el meu jugador</button>
          <button class="btn btn-secondary" onclick="Defineix.go('recover')">🔑 Ja tinc un codi</button>
        </div>
      </div>
    </section>`;
  }

  function renderCreate(){
    app.innerHTML = `${topbar(false)}<section class="screen panel form-card">
      <span class="eyebrow">Nou jugador</span>
      <h1>Crea el teu perfil</h1>
      <p>Utilitza un àlies. No escriguis el teu nom i cognoms reals.</p>
      <form class="form-grid" onsubmit="Defineix.createProfile(event)">
        <div class="field full"><label for="alias">Àlies o nickname</label><input id="alias" name="alias" maxlength="18" minlength="2" required placeholder="Ex.: DracBlau23"><span class="helper">Pot contenir una part del teu nom, però no el nom i cognoms complets.</span></div>
        <div class="field"><label for="grade">Curs</label><select id="grade" name="grade" required><option value="">Tria el curs</option><option value="1">1r</option><option value="2">2n</option><option value="3">3r</option><option value="4">4t</option><option value="5">5è</option><option value="6">6è</option></select></div>
        <div class="field"><label for="city">Municipi</label><input id="city" name="city" maxlength="50" required placeholder="Ex.: Viladecans"></div>
        <div class="field full"><label for="school">Escola</label><input id="school" name="school" maxlength="70" required placeholder="Ex.: Escola Pau Casals"></div>
        <div class="field full"><button class="btn btn-primary btn-wide" type="submit">Crear jugador i començar</button></div>
      </form>
      <div class="actions"><button class="small-link" onclick="Defineix.go('landing')">← Tornar</button></div>
    </section>`;
  }

  function renderRecover(){
    app.innerHTML = `${topbar(false)}<section class="screen panel form-card">
      <span class="eyebrow">Recuperar jugador</span>
      <h1>Ja tens un codi?</h1>
      <p>Escriu el teu codi de jugador.</p>
      <form class="form-grid" onsubmit="Defineix.recoverProfile(event)">
        <div class="field full"><label for="code">Codi</label><input id="code" name="code" maxlength="9" required placeholder="ABCD-2345" style="text-transform:uppercase;letter-spacing:.12em"></div>
        <div class="field full"><button class="btn btn-primary btn-wide" type="submit">Entrar</button></div>
      </form>
      <div id="recover-msg"></div>
      <div class="notice" style="margin-top:18px"><strong>Versió de prova:</strong> ara mateix el codi recupera perfils desats en aquest mateix dispositiu. Quan connectem la base de dades, funcionarà també entre dispositius diferents.</div>
      <div class="actions"><button class="small-link" onclick="Defineix.go('landing')">← Tornar</button></div>
    </section>`;
  }

  function renderDashboard(){
    const p=profile(); if(!p){screen='landing';return render();}
    const lvl=levelFor(p.xp), xp=xpIntoLevel(p.xp), badges=getBadges(p), dailyDone=p.stats.lastDailyAward===today();
    const welcome=welcomeCode?`<div class="welcome-banner"><div><span class="eyebrow">🎉 Perfil creat</span><strong>El teu codi és <span>${esc(welcomeCode)}</span></strong><small>Guarda’l. Quan activem la base de dades et servirà per entrar des de qualsevol dispositiu.</small></div><button class="btn btn-primary" onclick="Defineix.startPlay()">🎮 Jugar ara</button></div>`:'';
    app.innerHTML = `${topbar()}<section class="screen">
      ${welcome}
      <div class="section-head"><div><span class="eyebrow">${cycleName(p.grade)} · ${gradeLabel(p.grade)}</span><h1>Hola, ${esc(p.alias)}!</h1><p>Què vols fer avui?</p></div><button class="btn btn-soft" onclick="Defineix.go('leaderboard')">🏆 Classificacions</button></div>
      <div class="stats-row">
        <div class="stat"><strong>⭐ ${lvl}</strong><span>NIVELL</span></div>
        <div class="stat"><strong>🏆 ${(p.points||0).toLocaleString('ca-ES')}</strong><span>PUNTS</span></div>
        <div class="stat"><strong>🔥 ${p.stats.dailyStreak||0}</strong><span>RATXA DIÀRIA</span></div>
        <div class="stat"><strong>📅 ${p.stats.dailyCompleted||0}</strong><span>REPTES SUPERATS</span></div>
      </div>
      <div class="progress-wrap"><div class="progress-meta"><span>Nivell ${lvl}</span><span>${xp}/500 XP</span></div><div class="progress-track"><div class="progress-fill" style="width:${(xp/500)*100}%"></div></div></div>
      <div class="notice" style="margin-top:14px"><strong>🎯 Dificultat adaptativa activa.</strong> DEFINEIX! ajusta cada tipus de repte segons com vas evolucionant, sense canviar el teu curs.</div>
      <div class="mode-grid">
        <button class="mode-card" onclick="Defineix.startPlay()"><div class="mode-icon">🎮</div><h3>JUGAR</h3><p>10 paraules, reptes variats i punts per pujar a la classificació.</p></button>
        <button class="mode-card train" onclick="Defineix.go('training')"><div class="mode-icon">🧠</div><h3>ENTRENAR</h3><p>Tria exactament quin tipus d’activitat vols practicar.</p></button>
        <button class="mode-card daily" onclick="Defineix.startDaily()"><div class="mode-icon">${dailyDone?'✅':'⚡'}</div><h3>REPTE DEL DIA</h3><p>${dailyDone?'Ja l’has superat avui. El pots repetir!':'3 reptes curts. Supera’n 2 per sumar un dia de constància.'}</p></button>
      </div>
      <div class="panel mini-panel"><div class="section-head"><div><strong>Insígnies</strong><p>${badges.filter(b=>b.unlocked).length} de ${badges.length} aconseguides</p></div><button class="small-link" onclick="Defineix.go('profile')">Veure perfil →</button></div></div>
    </section>`;
  }

  function renderTraining(){
    const p=profile(); if(!p){screen='landing';return render();}
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">🧠 Mode entrenament</span><h1>Què vols practicar?</h1><p>Tria l’activitat. La dificultat s’ajustarà automàticament al teu ritme.</p></div></div>
      <div class="training-grid">
        ${TYPES.map(t=>`<button class="training-card" onclick="Defineix.startTraining('${t}')"><div class="mode-icon">${TYPE_INFO[t].icon}</div><strong>${TYPE_INFO[t].name}</strong><span>${TYPE_INFO[t].desc}</span></button>`).join('')}
        <button class="training-card" onclick="Defineix.startTraining('random')"><div class="mode-icon">🎲</div><strong>Entrenament variat</strong><span>Barreja tots els tipus de repte.</span></button>
        <button class="training-card" onclick="Defineix.startErrors()"><div class="mode-icon">🔁</div><strong>Practica els errors</strong><span>Prioritza paraules que has fallat anteriorment.</span></button>
      </div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar al menú</button></div>
    </section>`;
  }

  function adaptiveProfileHTML(p){
    return `<div class="panel profile-panel"><div class="section-head"><div><strong>Ritme adaptatiu</strong><p>El curs no canvia. DEFINEIX! regula la dificultat de cada activitat segons els teus últims resultats.</p></div></div><div class="badge-grid">${TYPES.map(type=>{const st=adaptiveState(p,type);return `<div class="badge"><div class="emoji">${TYPE_INFO[type].icon}</div><strong>${TYPE_INFO[type].name}</strong><span>${adaptiveLabel(st.level)}</span></div>`;}).join('')}</div></div>`;
  }

  function renderProfile(){
    const p=profile(); if(!p){screen='landing';return render();}
    const badges=getBadges(p), accuracy=p.stats.total?Math.round((p.stats.correct/p.stats.total)*100):0;
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">👤 Perfil</span><h1>${esc(p.alias)}</h1><p>${esc(p.school)} · ${esc(p.city)} · ${gradeLabel(p.grade)}</p></div><button class="btn btn-primary" onclick="Defineix.go('dashboard')">🎮 Anar al menú de joc</button></div>
      <div class="stats-row"><div class="stat"><strong>⭐ ${levelFor(p.xp)}</strong><span>NIVELL</span></div><div class="stat"><strong>${p.xp||0}</strong><span>XP TOTAL</span></div><div class="stat"><strong>${accuracy}%</strong><span>PRECISIÓ</span></div><div class="stat"><strong>${p.stats.correct||0}</strong><span>REPTES PERFECTES</span></div></div>
      <div class="panel profile-panel"><strong>El teu codi de jugador</strong><div class="profile-code">${esc(p.code)}</div><div class="notice">Guarda aquest codi. En aquesta versió encara només recupera el perfil en aquest dispositiu; serà multiplataforma quan activem la base de dades compartida.</div></div>
      ${adaptiveProfileHTML(p)}
      <div class="panel profile-panel"><div class="section-head"><div><strong>Insígnies</strong><p>Recompenses pel teu progrés i constància.</p></div></div><div class="badge-grid">${badges.map(b=>`<div class="badge ${b.unlocked?'':'locked'}"><div class="emoji">${b.emoji}</div><strong>${b.name}</strong><span>${b.desc}</span></div>`).join('')}</div></div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar al menú</button><button class="btn btn-danger" onclick="Defineix.logout()">Canviar de jugador</button></div>
    </section>`;
  }

  function renderLeaderboard(){
    const p=profile(); if(!p){screen='landing';return render();}
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">🏆 Classificacions</span><h1>Qui domina les paraules?</h1><p>General · curs · cicle · escola · municipi · reptes diaris</p></div></div>
      <div class="panel leader-placeholder"><div><div class="big-emoji">🔌</div><h2>Preparat per a la base de dades</h2><p>La classificació compartida s’activarà quan connectem Supabase.</p><div class="stats-row leader-stats"><div class="stat"><strong>${(p.points||0).toLocaleString('ca-ES')}</strong><span>ELS TEUS PUNTS</span></div><div class="stat"><strong>${p.stats.dailyCompleted||0}</strong><span>REPTES DIARIS</span></div><div class="stat"><strong>${p.stats.dailyStreak||0}</strong><span>RATXA</span></div><div class="stat"><strong>${levelFor(p.xp)}</strong><span>NIVELL</span></div></div></div></div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar</button></div>
    </section>`;
  }

  function wordsForGrade(grade){ return DATA.filter(w=>Array.isArray(w.grades)&&w.grades.includes(Number(grade))); }
  function pickEntry(type, used, rnd, opts={}){
    const p=profile(), all=wordsForGrade(p.grade); if(!all.length) return null;
    let pool=[...all];
    if(opts.errorsOnly){
      const errored=pool.filter(w=>(p.errors?.[w.id]||0)>0);
      if(errored.length) pool=errored;
    }
    const target=adaptiveState(p,type).level;
    const seen=p.seen||[];
    const scored=pool.map(entry=>{
      const diff=entryDifficulty(entry,type), errors=p.errors?.[entry.id]||0;
      let score=Math.abs(diff-target)*10 + rnd()*3;
      if(used.has(entry.id)) score+=100;
      if(!seen.includes(entry.id)) score-=3;
      if(opts.errorsOnly) score-=Math.min(errors,5)*2;
      else if(errors>0) score-=Math.min(errors,3)*.8;
      if(target<=2 && entry.vocab==='curricular') score+=5;
      if(target>=4 && entry.vocab==='quotidia' && diff<target-1) score+=3;
      return {entry,diff,score};
    }).sort((a,b)=>a.score-b.score);
    const best=scored[0]||null;
    return best?{entry:best.entry,difficulty:best.diff,targetLevel:target}:null;
  }

  function buildChallenges(count, fixedType=null, rnd=Math.random, opts={}){
    const used=new Set(), out=[];
    for(let i=0;i<count;i++){
      const type=fixedType && fixedType!=='random' ? fixedType : TYPES[Math.floor(rnd()*TYPES.length)];
      let picked=pickEntry(type,used,rnd,opts);
      if(!picked && used.size){ used.clear(); picked=pickEntry(type,used,rnd,opts); }
      if(!picked) break;
      used.add(picked.entry.id);
      out.push({entry:picked.entry,type,difficulty:picked.difficulty,targetLevel:picked.targetLevel});
    }
    return out;
  }

  function dailyChallenges(p,rnd){
    const d=today();
    if(p.dailySet?.date===d && Array.isArray(p.dailySet.items)){
      const restored=p.dailySet.items.map(item=>{
        const entry=DATA.find(w=>w.id===item.id && w.grades?.includes(Number(p.grade)));
        if(!entry||!TYPES.includes(item.type)) return null;
        return {entry,type:item.type,difficulty:entryDifficulty(entry,item.type),targetLevel:adaptiveState(p,item.type).level};
      }).filter(Boolean);
      if(restored.length===3) return restored;
    }
    const built=buildChallenges(3,null,rnd,{});
    p.dailySet={date:d,items:built.map(c=>({id:c.entry.id,type:c.type}))};
    saveDB();
    return built;
  }

  function startSession(mode, fixedType=null, errorsOnly=false){
    const p=profile(); if(!p) return;
    clearTransition(); welcomeCode=null;
    let rnd=Math.random, challenges;
    if(mode==='daily'){
      rnd=mulberry32(hash(today()+'|'+p.grade+'|'+p.code+'|DEFINEIX'));
      challenges=dailyChallenges(p,rnd);
    }else{
      challenges=buildChallenges(mode==='play'?10:8,fixedType,rnd,{errorsOnly});
    }
    session={mode,fixedType,index:0,challenges,correct:0,score:0,sessionStreak:0,maxSessionStreak:0,gainedXP:0,finished:false,adaptiveChanges:[]};
    challengeState=null;screen='game';render();
  }

  function renderGame(){
    if(!session || session.finished){screen='dashboard';return render();}
    if(session.index>=session.challenges.length) return finishSession();
    const c=session.challenges[session.index], entry=c.entry;
    if(!challengeState) challengeState=initChallenge(c);
    const pct=(session.index/session.challenges.length)*100;
    app.innerHTML = `${topbar(true,true)}<section class="screen game-screen">
      <div class="game-header"><button class="back-btn" onclick="Defineix.quitSession()" aria-label="Sortir de la partida">×</button><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="round-pill">${session.index+1} / ${session.challenges.length}</div></div>
      <article class="game-card">
        <div class="word-kicker">${TYPE_INFO[c.type].icon} ${TYPE_INFO[c.type].name} · ${esc(entry.area)}</div>
        <h1 class="word-title">${esc(entry.word)}</h1>
        ${renderChallenge(c)}
      </article>
    </section>`;
  }

  function initChallenge(c){
    const e=c.entry;
    if(c.type==='build') return {step:0,hadError:false,transitioning:false,completed:false,feedback:null,wrong:{},firstTry:e.segments.map(()=>null),orders:e.segments.map(seg=>shuffle(seg.options.map((text,index)=>({text,index}))))};
    if(c.type==='missing'){
      const missing=Math.floor(Math.random()*e.segments.length);
      return {missing,options:shuffle(e.segments[missing].options.map((text,index)=>({text,index}))),wrong:[],hadError:false,completed:false,feedback:null};
    }
    if(c.type==='surplus') return {pieces:shuffle([...e.segments.map((s,i)=>({text:s.correct,extra:false,key:i})),{text:e.extra,extra:true,key:'extra'}]),wrong:[],hadError:false,completed:false,feedback:null};
    if(c.type==='order') return {pool:shuffle(e.segments.map((s,i)=>({text:s.correct,original:i,used:false}))),selected:[],hadError:false,completed:false,feedback:null};
    return {};
  }

  function completePanel(e,s){
    return `<div class="complete-block"><span class="complete-label">${s.hadError?'💡 Definició resolta':'✅ Definició completa'}</span><div class="full-definition">${esc(definition(e))}</div>${s.hadError?'<p>Has necessitat corregir algun intent, però ara la definició és completa.</p>':'<p>Llegeix-la sencera abans de continuar.</p>'}<button class="btn btn-primary next-word" onclick="Defineix.finishCurrent()">Següent paraula →</button></div>`;
  }

  function renderChallenge(c){
    const e=c.entry,s=challengeState;
    if(s.completed) return completePanel(e,s);

    if(c.type==='build'){
      const built=e.segments.slice(0,s.step).map(seg=>`<span class="segment correct">${esc(seg.correct)}</span>`).join('');
      const seg=e.segments[s.step], opts=s.orders[s.step], wrong=s.wrong[s.step]||[];
      return `<p class="challenge-title">Construeix la definició. Quan encertis una peça, passaràs automàticament a la següent.</p>
        <div class="definition-builder">${built}<span class="segment placeholder">...</span></div>
        <div class="prompt-row"><span class="label-chip">Ara busca: ${esc(seg.label)}</span>${s.feedback?`<span class="mini-feedback ${s.feedback.good?'good':'bad'}">${s.feedback.good?'✓':'↺'} ${esc(s.feedback.text)}</span>`:''}</div>
        <div class="option-grid">${opts.map((o,i)=>`<button class="option ${wrong.includes(i)?'is-wrong':''} ${s.correctIndex===i?'is-correct':''}" ${(wrong.includes(i)||s.transitioning)?'disabled':''} onclick="Defineix.answerBuild(${i})">${esc(o.text)}</button>`).join('')}</div>`;
    }

    if(c.type==='missing'){
      const parts=e.segments.map((seg,i)=>i===s.missing?`<span class="segment placeholder">${esc(seg.label)}: ?</span>`:`<span class="segment">${esc(seg.correct)}</span>`).join('');
      return `<p class="challenge-title">Quina informació completa millor aquesta definició?</p><div class="definition-builder">${parts}</div>${s.feedback?`<div class="mini-feedback bad">↺ ${esc(s.feedback.text)}</div>`:''}<div class="option-grid">${s.options.map((o,i)=>`<button class="option ${s.wrong.includes(i)?'is-wrong':''}" ${s.wrong.includes(i)?'disabled':''} onclick="Defineix.answerMissing(${i})">${esc(o.text)}</button>`).join('')}</div>`;
    }

    if(c.type==='surplus'){
      return `<p class="challenge-title">Una d’aquestes peces és certa o possible, però <strong>no és necessària</strong> per definir <strong>${esc(e.word)}</strong>. Quina?</p>${s.feedback?`<div class="mini-feedback bad">↺ ${esc(s.feedback.text)}</div>`:''}<div class="option-grid">${s.pieces.map((x,i)=>`<button class="option ${s.wrong.includes(i)?'is-wrong':''}" ${s.wrong.includes(i)?'disabled':''} onclick="Defineix.answerSurplus(${i})">${esc(x.text)}</button>`).join('')}</div>`;
    }

    if(c.type==='order'){
      const slots=e.segments.map((seg,i)=>`<div class="order-slot"><small>${i+1}. ${esc(seg.label)}</small>${s.selected[i]?`<button class="order-piece selected" onclick="Defineix.removeOrder(${i})">${esc(s.selected[i].text)}</button>`:'<span class="order-empty">Tria una peça</span>'}</div>`).join('');
      const pool=s.pool.map((x,i)=>x.used?'':`<button class="order-piece" onclick="Defineix.selectOrder(${i})">${esc(x.text)}</button>`).join('');
      return `<p class="challenge-title">Col·loca les peces seguint l’estructura de la definició. Els títols t’indiquen què ha d’explicar cada part.</p><div class="order-slots">${slots}</div><div class="order-pool">${pool}</div>${s.feedback?`<div class="mini-feedback bad">↺ ${esc(s.feedback.text)}</div>`:''}<div class="actions compact-actions"><button class="btn btn-primary" ${s.selected.length!==e.segments.length?'disabled':''} onclick="Defineix.checkOrder()">Comprova</button><button class="btn btn-soft" onclick="Defineix.resetOrder()">Reinicia</button></div>`;
    }
    return '';
  }

  function answerBuild(index){
    const c=session.challenges[session.index],e=c.entry,s=challengeState;
    if(s.transitioning||s.completed) return;
    const seg=e.segments[s.step], chosen=s.orders[s.step][index], ok=chosen.text===seg.correct;
    if(s.firstTry[s.step]===null) s.firstTry[s.step]=ok?1:0;
    if(!ok){
      s.hadError=true; s.wrong[s.step]=s.wrong[s.step]||[]; if(!s.wrong[s.step].includes(index))s.wrong[s.step].push(index);
      s.feedback={good:false,text:'No és aquesta. Prova una altra opció.'}; renderCurrentOnly(); return;
    }
    s.correctIndex=index; s.transitioning=true; s.feedback={good:true,text:'Molt bé!'}; renderCurrentOnly();
    const currentSession=session, currentIndex=session.index;
    transitionTimer=setTimeout(()=>{
      transitionTimer=null;
      if(session!==currentSession || session.index!==currentIndex || !challengeState) return;
      s.correctIndex=null; s.feedback=null; s.transitioning=false;
      if(s.step>=e.segments.length-1) s.completed=true; else s.step++;
      renderCurrentOnly();
    },360);
  }

  function answerMissing(index){
    const c=session.challenges[session.index],s=challengeState,seg=c.entry.segments[s.missing],chosen=s.options[index];
    if(s.completed||s.wrong.includes(index))return;
    if(chosen.text!==seg.correct){s.hadError=true;s.wrong.push(index);s.feedback={text:'Aquesta peça no completa bé la part que falta. Torna-ho a provar.'};renderCurrentOnly();return;}
    s.feedback=null;s.completed=true;renderCurrentOnly();
  }

  function answerSurplus(index){
    const s=challengeState;if(s.completed||s.wrong.includes(index))return;
    if(!s.pieces[index].extra){s.hadError=true;s.wrong.push(index);s.feedback={text:'Aquesta informació sí que ajuda a definir la paraula. Prova una altra peça.'};renderCurrentOnly();return;}
    s.feedback=null;s.completed=true;renderCurrentOnly();
  }

  function selectOrder(i){
    const s=challengeState;if(s.completed||s.pool[i].used||s.selected.length>=s.pool.length)return;
    s.pool[i].used=true;s.selected.push(s.pool[i]);s.feedback=null;renderCurrentOnly();
  }
  function removeOrder(position){
    const s=challengeState;if(s.completed||position<0||position>=s.selected.length)return;
    const [item]=s.selected.splice(position,1);const poolItem=s.pool.find(p=>p.original===item.original);if(poolItem)poolItem.used=false;s.feedback=null;renderCurrentOnly();
  }
  function resetOrder(){
    const s=challengeState;if(!s||s.completed)return;
    s.selected=[];s.pool.forEach(p=>p.used=false);s.feedback=null;renderCurrentOnly();
  }
  function checkOrder(){
    const c=session.challenges[session.index],s=challengeState;if(s.completed||s.selected.length!==c.entry.segments.length)return;
    const ok=s.selected.every((x,i)=>x.original===i);
    if(!ok){s.hadError=true;s.feedback={text:'Encara hi ha alguna peça fora de lloc. Revisa els títols, modifica l’ordre i torna-ho a comprovar.'};renderCurrentOnly();return;}
    s.feedback=null;s.completed=true;renderCurrentOnly();
  }

  function renderCurrentOnly(){ renderGame(); }
  function definition(entry){ return entry.segments.map(s=>s.correct).join(' ').replace(/\s+([,.!?;:])/g,'$1')+'.'; }
  function challengePerformance(c,s){
    if(c.type==='build'){
      const values=s.firstTry.filter(v=>v!==null);
      return values.length?values.reduce((a,b)=>a+b,0)/values.length:(s.hadError?0:1);
    }
    return s.hadError?0:1;
  }
  function finishCurrent(){
    if(!challengeState?.completed)return;
    const c=session.challenges[session.index], performance=challengePerformance(c,challengeState);
    completeChallenge(!challengeState.hadError,performance);
  }

  function completeChallenge(perfect,performance){
    const p=profile(),c=session.challenges[session.index],difficulty=c.difficulty||entryDifficulty(c.entry,c.type);
    p.stats.total=(p.stats.total||0)+1;
    p.seen=p.seen||[];if(!p.seen.includes(c.entry.id))p.seen.push(c.entry.id);
    p.errors=p.errors||{};
    const adaptiveChange=recordAdaptive(p,c.type,performance);
    if(adaptiveChange) session.adaptiveChanges.push(adaptiveChange);
    if(perfect){
      p.stats.correct=(p.stats.correct||0)+1;session.correct++;session.sessionStreak++;session.maxSessionStreak=Math.max(session.maxSessionStreak,session.sessionStreak);if(p.errors[c.entry.id])p.errors[c.entry.id]=Math.max(0,p.errors[c.entry.id]-1);
      const xpGain=session.mode==='training'?8+difficulty*2:session.mode==='daily'?15+difficulty*3:14+difficulty*3+p.grade;
      p.xp=(p.xp||0)+xpGain;session.gainedXP+=xpGain;
      if(session.mode==='play'){
        const pts=70+difficulty*30+p.grade*5+Math.min(session.sessionStreak,5)*10;
        p.points=(p.points||0)+pts;session.score+=pts;
      }
    }else{
      session.sessionStreak=0;p.errors[c.entry.id]=(p.errors[c.entry.id]||0)+1;p.xp=(p.xp||0)+3;session.gainedXP+=3;
    }
    saveDB();session.index++;challengeState=null;
    if(session.index>=session.challenges.length)finishSession();else render();
  }

  function finishSession(){
    const p=profile();session.finished=true;let dailyAward=false;
    if(session.mode==='play')p.stats.games=(p.stats.games||0)+1;
    if(session.mode==='daily'&&session.correct>=2){
      const d=today();
      if(p.stats.lastDailyAward!==d){
        const diff=daysBetween(p.stats.lastDailyAward,d);p.stats.dailyStreak=diff===1?(p.stats.dailyStreak||0)+1:1;p.stats.bestDailyStreak=Math.max(p.stats.bestDailyStreak||0,p.stats.dailyStreak);p.stats.dailyCompleted=(p.stats.dailyCompleted||0)+1;p.stats.lastDailyAward=d;dailyAward=true;p.xp=(p.xp||0)+40;session.gainedXP+=40;
      }
    }
    session.dailyAward=dailyAward;saveDB();screen='results';render();
  }

  function renderResults(){
    if(!session){screen='dashboard';return render();}
    const total=session.challenges.length,pct=total?Math.round((session.correct/total)*100):0,passed=session.mode!=='daily'||session.correct>=2;
    const headline=session.mode==='daily'?(passed?'Repte superat!':'Torna-ho a intentar!'):(pct>=90?'Brillant!':pct>=70?'Molt bona partida!':pct>=50?'Bon entrenament!':'Continua practicant!');
    const adaptiveNote=session.adaptiveChanges.length?'<div class="notice" style="margin-top:16px"><strong>🎯 DEFINEIX! s’ha adaptat al teu ritme.</strong> En les properes partides ajustarà una mica la dificultat d’alguns tipus de repte segons els teus últims resultats.</div>':'';
    app.innerHTML=`${topbar()}<section class="screen panel result-card"><div class="result-emoji">${session.mode==='daily'?(passed?'⚡':'🧠'):(pct>=80?'🏆':'🧩')}</div><span class="eyebrow">Final de la partida</span><h1>${headline}</h1><div class="result-score">${session.correct}/${total}</div><p class="result-meta">${pct}% de reptes perfectes · +${session.gainedXP} XP${session.mode==='play'?` · +${session.score} punts`:''}</p>${session.mode==='daily'&&passed?`<div class="feedback good">📅 ${session.dailyAward?'Has sumat un nou repte diari.':'Ja havies superat el repte d’avui. La pràctica igualment et dona XP.'}</div>`:''}${session.mode==='daily'&&!passed?'<div class="feedback bad">Necessites completar perfectament almenys 2 dels 3 reptes. Pots tornar-hi avui tantes vegades com vulguis.</div>':''}${adaptiveNote}<div class="actions result-actions"><button class="btn btn-primary" onclick="Defineix.go('dashboard')">Tornar al menú</button>${session.mode==='daily'&&!passed?'<button class="btn btn-secondary" onclick="Defineix.startDaily()">Repetir repte</button>':''}</div></section>`;
  }

  function getBadges(p){
    const a=p.stats||{};
    return [
      {emoji:'🌱',name:'Primera paraula',desc:'Completa el primer repte.',unlocked:(a.total||0)>=1},
      {emoji:'🎯',name:'10 encerts',desc:'Aconsegueix 10 reptes perfectes.',unlocked:(a.correct||0)>=10},
      {emoji:'💎',name:'50 encerts',desc:'Aconsegueix 50 reptes perfectes.',unlocked:(a.correct||0)>=50},
      {emoji:'⚡',name:'Repte estrenat',desc:'Supera el primer repte del dia.',unlocked:(a.dailyCompleted||0)>=1},
      {emoji:'📅',name:'Constància 5',desc:'Supera 5 reptes diaris.',unlocked:(a.dailyCompleted||0)>=5},
      {emoji:'🏅',name:'Constància 20',desc:'Supera 20 reptes diaris.',unlocked:(a.dailyCompleted||0)>=20},
      {emoji:'🔥',name:'Ratxa de 5',desc:'Supera el repte durant 5 dies seguits.',unlocked:(a.bestDailyStreak||0)>=5},
      {emoji:'👑',name:'5.000 punts',desc:'Arriba als 5.000 punts en Mode Joc.',unlocked:(p.points||0)>=5000},
      {emoji:'📚',name:'Explorador',desc:'Descobreix 10 paraules diferents.',unlocked:(p.seen||[]).length>=10}
    ];
  }

  function createProfile(event){
    event.preventDefault();const f=new FormData(event.target),alias=spaces(f.get('alias')),grade=Number(f.get('grade')),school=spaces(f.get('school')),city=spaces(f.get('city'));
    if(alias.length<2||alias.length>18||!grade||!school||!city)return;
    const code=generateCode();
    const p={code,alias,grade,school,city,xp:0,points:0,seen:[],errors:{},createdAt:new Date().toISOString(),stats:{correct:0,total:0,games:0,dailyCompleted:0,dailyStreak:0,bestDailyStreak:0,lastDailyAward:null}};
    ensureProfile(p);db.profiles[code]=p;db.activeCode=code;welcomeCode=code;saveDB();screen='dashboard';render();
  }
  function recoverProfile(event){
    event.preventDefault();const code=spaces(new FormData(event.target).get('code')).toUpperCase(),msg=document.getElementById('recover-msg');
    if(db.profiles[code]){db.activeCode=code;ensureProfile(db.profiles[code]);welcomeCode=null;saveDB();screen='dashboard';render();}else if(msg)msg.innerHTML='<div class="feedback bad">No trobo aquest codi en aquest dispositiu. La recuperació entre dispositius arribarà amb la base de dades compartida.</div>';
  }
  function logout(){clearTransition();db.activeCode=null;saveDB();session=null;challengeState=null;welcomeCode=null;screen='landing';render();}
  function quitSession(){if(confirm('Vols sortir de la partida?')){clearTransition();session=null;challengeState=null;screen='dashboard';render();}}

  window.Defineix={
    go(route){clearTransition();if(route==='dashboard')session=null;screen=route;render();},
    createProfile,recoverProfile,logout,quitSession,
    startPlay(){startSession('play');},startDaily(){startSession('daily');},startTraining(type){startSession('training',type);},startErrors(){startSession('training','random',true);},
    answerBuild,answerMissing,answerSurplus,selectOrder,removeOrder,resetOrder,checkOrder,finishCurrent
  };

  render();
})();
