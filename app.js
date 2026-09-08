(() => {
  'use strict';

  const DATA = window.DEFINEIX_DATA || [];
  const STORAGE_KEY = 'defineix_v01';
  const TZ = 'Europe/Madrid';
  const TYPES = ['build','order','missing','surplus'];
  const TYPE_INFO = {
    build:{icon:'🧩',name:'Construeix la definició',desc:'Tria peça a peça la informació necessària.'},
    order:{icon:'🔀',name:'Ordena-la',desc:'Posa les parts de la definició en un ordre coherent.'},
    missing:{icon:'🕳️',name:'Què hi falta?',desc:'Completa la part que falta en una definició.'},
    surplus:{icon:'🧹',name:'Què hi sobra?',desc:'Detecta la informació que no és necessària per definir.'}
  };

  let db = loadDB();
  let screen = db.activeCode && db.profiles[db.activeCode] ? 'dashboard' : 'landing';
  let session = null;
  let challengeState = null;
  const app = document.getElementById('app');

  function loadDB(){
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if(parsed && parsed.profiles) return parsed;
    }catch(e){}
    return {profiles:{},activeCode:null};
  }
  function saveDB(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  function profile(){ return db.activeCode ? db.profiles[db.activeCode] : null; }
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
  function today(){
    return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }
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

  function topbar(showPlayer=true){
    const p=profile();
    return `<header class="topbar">
      <button class="brand small-link" onclick="Defineix.go('${p?'dashboard':'landing'}')" aria-label="Anar a l'inici">
        <span class="logo-bubble">DIC</span>
        <span><span class="brand-title">DEFINEIX!</span><span class="brand-sub">Construeix significats</span></span>
      </button>
      ${showPlayer && p ? `<button class="player-chip" onclick="Defineix.go('profile')">
        <span class="player-avatar">${esc(p.alias).slice(0,1).toUpperCase()}</span>
        <span class="player-meta"><strong>${esc(p.alias)}</strong><br><small>${p.grade}r${p.grade===1?'':p.grade===2?'n':p.grade===3?'r':'è'} · Nivell ${levelFor(p.xp)}</small></span>
      </button>`:''}
    </header>`;
  }

  function render(){
    const routes={landing:renderLanding,create:renderCreate,recover:renderRecover,dashboard:renderDashboard,training:renderTraining,profile:renderProfile,leaderboard:renderLeaderboard,game:renderGame,results:renderResults};
    (routes[screen] || renderLanding)();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderLanding(){
    app.innerHTML = `${topbar(false)}<section class="screen hero">
      <div class="panel hero-copy">
        <span class="eyebrow">🧠 Joc de vocabulari en català</span>
        <h1>Aprèn a <span>definir.</span></h1>
        <p>No tradueixis la paraula: pensa què és, què la caracteritza i quina informació és realment important. Construeix definicions cada vegada més precises.</p>
        <div class="actions">
          <button class="btn btn-primary" onclick="Defineix.go('create')">✨ Crea el meu jugador</button>
          <button class="btn btn-secondary" onclick="Defineix.go('recover')">🔑 Ja tinc un codi</button>
        </div>
      </div>
      <aside class="panel guide-card">
        <div class="guide-face">DIC</div>
        <h3>Hola! Soc en DIC.</h3>
        <p>T'ajudaré a descobrir com es construeix una bona definició.</p>
      </aside>
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
        <div class="field full"><button class="btn btn-primary btn-wide" type="submit">Crear jugador</button></div>
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
      <div class="notice" style="margin-top:18px"><strong>Versió de prova:</strong> ara mateix el codi recupera perfils desats en aquest mateix dispositiu. Quan connectem la base de dades, funcionarà també entre Chromebooks, tauletes i mòbils diferents.</div>
      <div class="actions"><button class="small-link" onclick="Defineix.go('landing')">← Tornar</button></div>
    </section>`;
  }

  function renderDashboard(){
    const p=profile(); if(!p){screen='landing';return render();}
    const lvl=levelFor(p.xp), xp=xpIntoLevel(p.xp), badges=getBadges(p), dailyDone=p.stats.lastDailyAward===today();
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">${cycleName(p.grade)} · ${p.grade}è</span><h1>Hola, ${esc(p.alias)}!</h1><p>Quin repte vols fer avui?</p></div><button class="btn btn-soft" onclick="Defineix.go('leaderboard')">🏆 Classificacions</button></div>
      <div class="stats-row">
        <div class="stat"><strong>⭐ ${lvl}</strong><span>NIVELL</span></div>
        <div class="stat"><strong>🏆 ${(p.points||0).toLocaleString('ca-ES')}</strong><span>PUNTS</span></div>
        <div class="stat"><strong>🔥 ${p.stats.dailyStreak||0}</strong><span>RATXA DIÀRIA</span></div>
        <div class="stat"><strong>📅 ${p.stats.dailyCompleted||0}</strong><span>REPTES SUPERATS</span></div>
      </div>
      <div class="progress-wrap"><div style="display:flex;justify-content:space-between;font-size:.78rem;font-weight:850;color:var(--muted);margin-bottom:6px"><span>Nivell ${lvl}</span><span>${xp}/500 XP</span></div><div class="progress-track"><div class="progress-fill" style="width:${(xp/500)*100}%"></div></div></div>
      <div class="mode-grid">
        <button class="mode-card" onclick="Defineix.startPlay()"><div class="mode-icon">🎮</div><h3>JUGAR</h3><p>10 paraules, reptes variats i punts per pujar a la classificació.</p></button>
        <button class="mode-card train" onclick="Defineix.go('training')"><div class="mode-icon">🧠</div><h3>ENTRENAR</h3><p>Tria exactament quin tipus de definició vols practicar.</p></button>
        <button class="mode-card daily" onclick="Defineix.startDaily()"><div class="mode-icon">${dailyDone?'✅':'⚡'}</div><h3>REPTE DEL DIA</h3><p>${dailyDone?'Ja l’has superat avui. El pots repetir!':'3 reptes curts. Supera’n 2 per sumar un dia a la classificació de constància.'}</p></button>
      </div>
      <div class="panel" style="margin-top:20px;padding:20px"><div class="section-head"><div><strong>Insígnies</strong><p>${badges.filter(b=>b.unlocked).length} de ${badges.length} aconseguides</p></div><button class="small-link" onclick="Defineix.go('profile')">Veure perfil →</button></div></div>
    </section>`;
  }

  function renderTraining(){
    const p=profile(); if(!p){screen='landing';return render();}
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">🧠 Mode entrenament</span><h1>Què vols practicar?</h1><p>Aquí l’objectiu és aprendre. Guanyaràs XP, però no punts de classificació.</p></div></div>
      <div class="training-grid">
        ${TYPES.map(t=>`<button class="training-card" onclick="Defineix.startTraining('${t}')"><div class="mode-icon">${TYPE_INFO[t].icon}</div><strong>${TYPE_INFO[t].name}</strong><span>${TYPE_INFO[t].desc}</span></button>`).join('')}
        <button class="training-card" onclick="Defineix.startTraining('random')"><div class="mode-icon">🎲</div><strong>Entrenament variat</strong><span>Barreja tots els tipus de repte.</span></button>
        <button class="training-card" onclick="Defineix.startErrors()"><div class="mode-icon">🔁</div><strong>Practica els errors</strong><span>Prioritza paraules que has fallat anteriorment.</span></button>
      </div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar</button></div>
    </section>`;
  }

  function renderProfile(){
    const p=profile(); if(!p){screen='landing';return render();}
    const badges=getBadges(p);
    const accuracy=p.stats.total?Math.round((p.stats.correct/p.stats.total)*100):0;
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">👤 Perfil</span><h1>${esc(p.alias)}</h1><p>${esc(p.school)} · ${esc(p.city)} · ${p.grade}è</p></div></div>
      <div class="stats-row"><div class="stat"><strong>⭐ ${levelFor(p.xp)}</strong><span>NIVELL</span></div><div class="stat"><strong>${p.xp||0}</strong><span>XP TOTAL</span></div><div class="stat"><strong>${accuracy}%</strong><span>PRECISIÓ</span></div><div class="stat"><strong>${p.stats.correct||0}</strong><span>ENCERTS</span></div></div>
      <div class="panel" style="margin-top:18px"><strong>El teu codi de jugador</strong><div class="profile-code">${esc(p.code)}</div><div class="notice">Guarda aquest codi. En aquesta v0.1 encara només recupera el perfil en aquest dispositiu; serà multiplataforma quan activem la base de dades compartida.</div></div>
      <div class="panel" style="margin-top:18px"><div class="section-head"><div><strong>Insígnies</strong><p>Recompenses pel teu progrés i constància.</p></div></div><div class="badge-grid">${badges.map(b=>`<div class="badge ${b.unlocked?'':'locked'}"><div class="emoji">${b.emoji}</div><strong>${b.name}</strong><span>${b.desc}</span></div>`).join('')}</div></div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar</button><button class="btn btn-danger" onclick="Defineix.logout()">Canviar de jugador</button></div>
    </section>`;
  }

  function renderLeaderboard(){
    const p=profile(); if(!p){screen='landing';return render();}
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="section-head"><div><span class="eyebrow">🏆 Classificacions</span><h1>Qui domina les paraules?</h1><p>General · curs · cicle · escola · municipi · reptes diaris</p></div></div>
      <div class="panel leader-placeholder" style="margin-top:20px"><div><div style="font-size:3rem">🔌</div><h2>Preparat per a la base de dades</h2><p>La interfície ja està prevista, però la classificació compartida s’activarà quan connectem Supabase. Així evitarem l’antic sistema de files duplicades en un full de càlcul.</p><div class="stats-row" style="max-width:650px;margin:22px auto"><div class="stat"><strong>${(p.points||0).toLocaleString('ca-ES')}</strong><span>ELS TEUS PUNTS</span></div><div class="stat"><strong>${p.stats.dailyCompleted||0}</strong><span>REPTES DIARIS</span></div><div class="stat"><strong>${p.stats.dailyStreak||0}</strong><span>RATXA</span></div><div class="stat"><strong>${levelFor(p.xp)}</strong><span>NIVELL</span></div></div></div></div>
      <div class="actions"><button class="btn btn-soft" onclick="Defineix.go('dashboard')">← Tornar</button></div>
    </section>`;
  }

  function wordsForGrade(grade){ return DATA.filter(w=>w.grades.includes(Number(grade))); }
  function selectWords(count, opts={}){
    const p=profile(), all=wordsForGrade(p.grade); if(!all.length) return [];
    let pool=[...all];
    if(opts.errorsOnly){
      const errs=pool.filter(w=>(p.errors?.[w.id]||0)>0).sort((a,b)=>(p.errors[b.id]||0)-(p.errors[a.id]||0));
      if(errs.length) pool=[...errs,...pool.filter(w=>!errs.includes(w))];
    }else{
      const unseen=pool.filter(w=>!p.seen.includes(w.id));
      pool=[...shuffle(unseen),...shuffle(pool.filter(w=>p.seen.includes(w.id)))];
    }
    const out=[]; while(out.length<count){ for(const w of pool){out.push(w);if(out.length===count)break;} if(!pool.length)break; }
    return out;
  }
  function createChallenges(words, fixedType=null, rnd=Math.random){
    return words.map((entry,i)=>({entry,type:fixedType && fixedType!=='random'?fixedType:TYPES[Math.floor(rnd()*TYPES.length)]}));
  }

  function startSession(mode, fixedType=null, errorsOnly=false){
    const p=profile(); if(!p) return;
    let words, rnd=Math.random;
    if(mode==='daily'){
      rnd=mulberry32(hash(today()+'|'+p.grade+'|DEFINEIX'));
      words=shuffle(wordsForGrade(p.grade),rnd).slice(0,3);
    }else{
      words=selectWords(mode==='play'?10:8,{errorsOnly});
    }
    session={mode,fixedType,index:0,challenges:createChallenges(words,fixedType,rnd),correct:0,score:0,sessionStreak:0,maxSessionStreak:0,gainedXP:0,finished:false};
    challengeState=null; screen='game'; render();
  }

  function renderGame(){
    if(!session || session.finished){screen='dashboard';return render();}
    if(session.index>=session.challenges.length) return finishSession();
    const c=session.challenges[session.index], entry=c.entry;
    if(!challengeState) challengeState=initChallenge(c);
    const pct=(session.index/session.challenges.length)*100;
    app.innerHTML = `${topbar()}<section class="screen">
      <div class="game-header"><button class="back-btn" onclick="Defineix.quitSession()">×</button><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><div class="round-pill">${session.index+1} / ${session.challenges.length}</div></div>
      <article class="game-card">
        <div class="word-kicker">${TYPE_INFO[c.type].icon} ${TYPE_INFO[c.type].name} · ${esc(entry.area)}</div>
        <h1 class="word-title">${esc(entry.word)}</h1>
        ${renderChallenge(c)}
      </article>
    </section>`;
  }

  function initChallenge(c){
    if(c.type==='build') return {step:0,hadError:false,locked:false,feedback:null};
    if(c.type==='missing'){
      const idx=Math.floor(Math.random()*c.entry.segments.length);
      return {missing:idx,locked:false,feedback:null};
    }
    if(c.type==='surplus'){
      const pieces=shuffle([...c.entry.segments.map(s=>({text:s.correct,extra:false})),{text:c.entry.extra,extra:true}]);
      return {pieces,locked:false,feedback:null};
    }
    if(c.type==='order'){
      return {pool:shuffle(c.entry.segments.map((s,i)=>({text:s.correct,original:i}))),selected:[],locked:false,feedback:null};
    }
    return {};
  }

  function renderChallenge(c){
    const e=c.entry, s=challengeState;
    if(c.type==='build'){
      const built=e.segments.slice(0,s.step).map(seg=>`<span class="segment">${esc(seg.correct)}</span>`).join('');
      if(s.step>=e.segments.length) return `<p class="challenge-title">Has construït la definició.</p><div class="definition-builder">${e.segments.map(x=>`<span class="segment correct">${esc(x.correct)}</span>`).join('')}</div>${feedbackHTML(s.feedback)}`;
      const seg=e.segments[s.step];
      return `<p class="challenge-title">Construeix la definició pas a pas.</p><div class="definition-builder">${built}<span class="segment placeholder">...</span></div><span class="label-chip">${esc(seg.label)}</span><div class="option-grid">${shuffle(seg.options).map((o,i)=>`<button class="option" ${s.locked?'disabled':''} data-text="${esc(o)}" onclick="Defineix.answerBuild(this)">${esc(o)}</button>`).join('')}</div>${feedbackHTML(s.feedback)}`;
    }
    if(c.type==='missing'){
      const miss=e.segments[s.missing];
      const parts=e.segments.map((seg,i)=>i===s.missing?`<span class="segment placeholder">${esc(seg.label)}: ?</span>`:`<span class="segment">${esc(seg.correct)}</span>`).join('');
      return `<p class="challenge-title">Quina informació completa millor aquesta definició?</p><div class="definition-builder">${parts}</div><div class="option-grid">${shuffle(miss.options).map(o=>`<button class="option" ${s.locked?'disabled':''} onclick="Defineix.answerMissing(this)" data-text="${esc(o)}">${esc(o)}</button>`).join('')}</div>${feedbackHTML(s.feedback)}`;
    }
    if(c.type==='surplus'){
      return `<p class="challenge-title">Una d’aquestes peces no és necessària per definir <strong>${esc(e.word)}</strong>. Quina?</p><div class="option-grid">${s.pieces.map((x,i)=>`<button class="option" ${s.locked?'disabled':''} onclick="Defineix.answerSurplus(${i},this)">${esc(x.text)}</button>`).join('')}</div>${feedbackHTML(s.feedback)}`;
    }
    if(c.type==='order'){
      const selected=s.selected.map(x=>`<button class="order-piece selected" onclick="Defineix.undoOrder()">${esc(x.text)}</button>`).join('');
      const pool=s.pool.map((x,i)=>x.used?'':`<button class="order-piece" ${s.locked?'disabled':''} onclick="Defineix.selectOrder(${i})">${esc(x.text)}</button>`).join('');
      return `<p class="challenge-title">Ordena les peces per formar una definició clara.</p><div class="order-zone">${selected || '<span class="segment placeholder">Toca les peces en l’ordre correcte</span>'}</div><div class="order-zone">${pool}</div><div class="actions"><button class="btn btn-primary" ${s.selected.length!==e.segments.length||s.locked?'disabled':''} onclick="Defineix.checkOrder()">Comprova</button><button class="btn btn-soft" ${s.locked?'disabled':''} onclick="Defineix.resetOrder()">Reinicia</button></div>${feedbackHTML(s.feedback)}`;
    }
    return '';
  }

  function feedbackHTML(f){
    if(!f) return '';
    return `<div class="feedback ${f.good?'good':'bad'}">${f.good?'✅':'💡'} ${esc(f.title)}${f.detail?`<small>${esc(f.detail)}</small>`:''}</div>${f.next?`<div class="actions"><button class="btn btn-primary" onclick="Defineix.nextAfterFeedback()">${esc(f.next)}</button></div>`:''}`;
  }

  function answerBuild(btn){
    const c=session.challenges[session.index], e=c.entry, s=challengeState, seg=e.segments[s.step]; if(s.locked)return;
    const chosen=btn.dataset.text, ok=chosen===seg.correct; s.locked=true;
    if(!ok) s.hadError=true;
    [...btn.parentElement.children].forEach(b=>{b.disabled=true;if(b.dataset.text===seg.correct)b.classList.add('is-correct');});
    if(!ok) btn.classList.add('is-wrong');
    s.feedback={good:ok,title:ok?'Molt bé! Aquesta peça és adequada.':'Aquesta peça no defineix bé la paraula.',detail:ok?seg.label:`La peça adequada és: ${seg.correct}`,next:s.step===e.segments.length-1?'Acaba la paraula':'Continua'};
    renderCurrentOnly();
  }
  function nextAfterFeedback(){
    const c=session.challenges[session.index], s=challengeState;
    if(c.type==='build'){
      if(s.step<c.entry.segments.length-1){s.step++;s.locked=false;s.feedback=null;return renderCurrentOnly();}
      return completeChallenge(!s.hadError);
    }
    if(s.feedback && s.feedback.final) return completeChallenge(s.feedback.correct);
  }
  function answerMissing(btn){
    const c=session.challenges[session.index], s=challengeState, seg=c.entry.segments[s.missing]; if(s.locked)return;
    const ok=btn.dataset.text===seg.correct; s.locked=true;
    [...btn.parentElement.children].forEach(b=>{b.disabled=true;if(b.dataset.text===seg.correct)b.classList.add('is-correct');}); if(!ok)btn.classList.add('is-wrong');
    s.feedback={good:ok,title:ok?'Has trobat la informació que faltava.':'Fixa’t en què demanava aquella part de la definició.',detail:`Definició: ${definition(c.entry)}`,next:'Següent',final:true,correct:ok}; renderCurrentOnly();
  }
  function answerSurplus(i,btn){
    const s=challengeState; if(s.locked)return; const ok=s.pieces[i].extra; s.locked=true;
    const buttons=[...btn.parentElement.children]; buttons.forEach((b,j)=>{b.disabled=true;if(s.pieces[j].extra)b.classList.add('is-correct');}); if(!ok)btn.classList.add('is-wrong');
    s.feedback={good:ok,title:ok?'Exacte: és una informació prescindible.':'Aquesta informació sí que ajuda a definir.',detail:`Una definició ha de prioritzar els trets essencials. Definició: ${definition(session.challenges[session.index].entry)}`,next:'Següent',final:true,correct:ok}; renderCurrentOnly();
  }
  function selectOrder(i){ const s=challengeState;if(s.locked||s.pool[i].used)return;s.pool[i].used=true;s.selected.push(s.pool[i]);renderCurrentOnly(); }
  function undoOrder(){ const s=challengeState;if(s.locked||!s.selected.length)return;const x=s.selected.pop();s.pool.find(p=>p.original===x.original).used=false;renderCurrentOnly(); }
  function resetOrder(){ const s=challengeState;if(s.locked)return;s.selected=[];s.pool.forEach(p=>p.used=false);renderCurrentOnly(); }
  function checkOrder(){
    const c=session.challenges[session.index],s=challengeState;if(s.locked)return;const ok=s.selected.every((x,i)=>x.original===i);s.locked=true;
    s.feedback={good:ok,title:ok?'Ordre perfecte!':'Les peces són bones, però l’ordre es pot millorar.',detail:`Definició: ${definition(c.entry)}`,next:'Següent',final:true,correct:ok};renderCurrentOnly();
  }
  function renderCurrentOnly(){ renderGame(); }
  function definition(entry){ return entry.segments.map(s=>s.correct).join(' ')+'.'; }

  function completeChallenge(correct){
    const p=profile(), c=session.challenges[session.index];
    p.stats.total=(p.stats.total||0)+1;
    p.seen=p.seen||[]; if(!p.seen.includes(c.entry.id))p.seen.push(c.entry.id);
    p.errors=p.errors||{};
    if(correct){
      p.stats.correct=(p.stats.correct||0)+1; session.correct++; session.sessionStreak++; session.maxSessionStreak=Math.max(session.maxSessionStreak,session.sessionStreak); if(p.errors[c.entry.id])p.errors[c.entry.id]=Math.max(0,p.errors[c.entry.id]-1);
      let xpGain=session.mode==='training'?12:session.mode==='daily'?25:20+(p.grade*2); p.xp=(p.xp||0)+xpGain;session.gainedXP+=xpGain;
      if(session.mode==='play'){const pts=100+(p.grade-1)*15+Math.min(session.sessionStreak,5)*10;p.points=(p.points||0)+pts;session.score+=pts;}
    }else{
      session.sessionStreak=0; p.errors[c.entry.id]=(p.errors[c.entry.id]||0)+1; p.xp=(p.xp||0)+3;session.gainedXP+=3;
    }
    saveDB(); session.index++; challengeState=null;
    if(session.index>=session.challenges.length) finishSession(); else render();
  }

  function finishSession(){
    const p=profile(); session.finished=true; let dailyAward=false;
    if(session.mode==='play') p.stats.games=(p.stats.games||0)+1;
    if(session.mode==='daily' && session.correct>=2){
      const d=today();
      if(p.stats.lastDailyAward!==d){
        const diff=daysBetween(p.stats.lastDailyAward,d);
        p.stats.dailyStreak=diff===1?(p.stats.dailyStreak||0)+1:1;
        p.stats.bestDailyStreak=Math.max(p.stats.bestDailyStreak||0,p.stats.dailyStreak);
        p.stats.dailyCompleted=(p.stats.dailyCompleted||0)+1;
        p.stats.lastDailyAward=d; dailyAward=true; p.xp=(p.xp||0)+40;session.gainedXP+=40;
      }
    }
    session.dailyAward=dailyAward; saveDB(); screen='results'; render();
  }

  function renderResults(){
    if(!session){screen='dashboard';return render();}
    const total=session.challenges.length, pct=Math.round((session.correct/total)*100), passed=session.mode!=='daily'||session.correct>=2;
    const headline=session.mode==='daily'?(passed?'Repte superat!':'Torna-ho a intentar!'):(pct>=90?'Brillant!':pct>=70?'Molt bona partida!':pct>=50?'Bon entrenament!':'Continua practicant!');
    app.innerHTML=`${topbar()}<section class="screen panel result-card">
      <div class="result-emoji">${session.mode==='daily'?(passed?'⚡':'🧠'):(pct>=80?'🏆':'🧩')}</div><span class="eyebrow">Final de la partida</span><h1>${headline}</h1>
      <div class="result-score">${session.correct}/${total}</div><p class="result-meta">${pct}% d’encerts · +${session.gainedXP} XP${session.mode==='play'?` · +${session.score} punts`:''}</p>
      ${session.mode==='daily'&&passed?`<div class="feedback good">📅 ${session.dailyAward?'Has sumat un nou repte diari a la teva col·lecció.':'Ja havies superat el repte d’avui. La pràctica igualment et dona XP.'}</div>`:''}
      ${session.mode==='daily'&&!passed?`<div class="feedback bad">Necessites encertar almenys 2 dels 3 reptes. Pots tornar-hi avui tantes vegades com vulguis.</div>`:''}
      <div class="actions" style="justify-content:center"><button class="btn btn-primary" onclick="Defineix.go('dashboard')">Tornar al menú</button>${session.mode==='daily'&&!passed?`<button class="btn btn-secondary" onclick="Defineix.startDaily()">Repetir repte</button>`:''}</div>
    </section>`;
  }

  function getBadges(p){
    const a=p.stats||{};
    return [
      {emoji:'🌱',name:'Primera paraula',desc:'Completa el primer repte.',unlocked:(a.total||0)>=1},
      {emoji:'🎯',name:'10 encerts',desc:'Aconsegueix 10 respostes correctes.',unlocked:(a.correct||0)>=10},
      {emoji:'💎',name:'50 encerts',desc:'Aconsegueix 50 respostes correctes.',unlocked:(a.correct||0)>=50},
      {emoji:'⚡',name:'Repte estrenat',desc:'Supera el primer repte del dia.',unlocked:(a.dailyCompleted||0)>=1},
      {emoji:'📅',name:'Constància 5',desc:'Supera 5 reptes diaris.',unlocked:(a.dailyCompleted||0)>=5},
      {emoji:'🏅',name:'Constància 20',desc:'Supera 20 reptes diaris.',unlocked:(a.dailyCompleted||0)>=20},
      {emoji:'🔥',name:'Ratxa de 5',desc:'Supera el repte durant 5 dies seguits.',unlocked:(a.bestDailyStreak||0)>=5},
      {emoji:'👑',name:'5.000 punts',desc:'Arriba als 5.000 punts en Mode Joc.',unlocked:(p.points||0)>=5000},
      {emoji:'📚',name:'Explorador',desc:'Descobreix 10 paraules diferents.',unlocked:(p.seen||[]).length>=10}
    ];
  }

  function createProfile(event){
    event.preventDefault(); const f=new FormData(event.target), alias=spaces(f.get('alias')), grade=Number(f.get('grade')), school=spaces(f.get('school')), city=spaces(f.get('city'));
    if(alias.length<2||alias.length>18||!grade||!school||!city)return;
    const code=generateCode();
    db.profiles[code]={code,alias,grade,school,city,xp:0,points:0,seen:[],errors:{},createdAt:new Date().toISOString(),stats:{correct:0,total:0,games:0,dailyCompleted:0,dailyStreak:0,bestDailyStreak:0,lastDailyAward:null}};
    db.activeCode=code;saveDB();screen='profile';render();
  }
  function recoverProfile(event){
    event.preventDefault(); const code=spaces(new FormData(event.target).get('code')).toUpperCase(); const msg=document.getElementById('recover-msg');
    if(db.profiles[code]){db.activeCode=code;saveDB();screen='dashboard';render();}else if(msg){msg.innerHTML='<div class="feedback bad">No trobo aquest codi en aquest dispositiu. La recuperació entre dispositius arribarà amb la base de dades compartida.</div>';}
  }
  function logout(){db.activeCode=null;saveDB();session=null;screen='landing';render();}
  function quitSession(){ if(confirm('Vols sortir de la partida? El progrés d’aquesta partida no es completarà.')){session=null;challengeState=null;screen='dashboard';render();} }

  window.Defineix={
    go(route){session=route==='dashboard'?null:session;screen=route;render();},
    createProfile,recoverProfile,logout,quitSession,
    startPlay(){startSession('play');},
    startDaily(){startSession('daily');},
    startTraining(type){startSession('training',type);},
    startErrors(){startSession('training','random',true);},
    answerBuild,answerMissing,answerSurplus,selectOrder,undoOrder,resetOrder,checkOrder,nextAfterFeedback
  };

  render();
})();
