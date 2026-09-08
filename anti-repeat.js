(() => {
  'use strict';

  const DATA = window.DEFINEIX_DATA;
  const API = window.Defineix;
  const APP = document.getElementById('app');
  if (!Array.isArray(DATA) || !API || !APP) return;

  const DB_KEY = 'defineix_v01';
  const STATE_KEY = 'defineix_rotation_v2';
  const LEGACY_RECENT_KEY = 'defineix_recent_words_v1';
  const MAX_RECENT = 30;

  function readJSON(key){
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch(e){ return {}; }
  }
  function writeJSON(key,value){
    try { localStorage.setItem(key,JSON.stringify(value)); }
    catch(e){}
  }
  function activeProfile(){
    const db=readJSON(DB_KEY), code=db.activeCode;
    const profile=code && db.profiles ? db.profiles[code] : null;
    return profile ? {code,profile} : null;
  }
  function unique(values){ return [...new Set((values||[]).filter(Boolean))]; }
  function entryMatchesGrade(entry,grade){
    return Array.isArray(entry.grades) && entry.grades.includes(Number(grade));
  }
  function eligibleWords(grade){
    return unique(DATA.filter(e=>entryMatchesGrade(e,grade)).map(e=>e.word));
  }

  function initialSeenWords(active,grade){
    const words=[];
    const legacy=readJSON(LEGACY_RECENT_KEY);
    if(Array.isArray(legacy[active.code])) words.push(...legacy[active.code]);
    const seen=Array.isArray(active.profile.seen) ? active.profile.seen : [];
    for(const id of seen){
      const entry=DATA.find(e=>e.id===id && entryMatchesGrade(e,grade));
      if(entry?.word) words.push(entry.word);
    }
    return unique(words);
  }

  function loadState(active){
    const grade=Number(active.profile.grade);
    const store=readJSON(STATE_KEY);
    store[active.code]=store[active.code] || {};
    let state=store[active.code][grade];
    if(!state || !Array.isArray(state.used) || !Array.isArray(state.recent)){
      const seeded=initialSeenWords(active,grade);
      state={used:[...seeded],recent:seeded.slice(-MAX_RECENT)};
      store[active.code][grade]=state;
      writeJSON(STATE_KEY,store);
    }
    return {store,grade,state};
  }

  function saveState(active,pack){
    pack.store[active.code]=pack.store[active.code] || {};
    pack.store[active.code][pack.grade]=pack.state;
    writeJSON(STATE_KEY,pack.store);
  }

  function normalizeState(active,pack){
    const valid=new Set(eligibleWords(pack.grade));
    pack.state.used=unique(pack.state.used).filter(w=>valid.has(w));
    pack.state.recent=unique(pack.state.recent).filter(w=>valid.has(w)).slice(-MAX_RECENT);
    saveState(active,pack);
    return valid;
  }

  function rememberWord(word){
    const active=activeProfile();
    if(!active || !word) return;
    const clean=String(word).trim();
    if(!clean) return;
    const pack=loadState(active);
    normalizeState(active,pack);
    if(!pack.state.used.includes(clean)) pack.state.used.push(clean);
    pack.state.recent=pack.state.recent.filter(w=>w!==clean);
    pack.state.recent.push(clean);
    pack.state.recent=pack.state.recent.slice(-MAX_RECENT);
    saveState(active,pack);
  }

  function runWithRotation(original,context,args,reserve){
    const active=activeProfile();
    if(!active) return original.apply(context,args);

    const pack=loadState(active);
    const valid=normalizeState(active,pack);
    if(valid.size <= reserve) return original.apply(context,args);

    let usedSet=new Set(pack.state.used);
    let remaining=[...valid].filter(w=>!usedSet.has(w));

    // Quan ja queda massa poc banc per construir una sessió variada, comença una
    // volta nova, però les 30 paraules més recents continuen bloquejades.
    if(remaining.length < reserve){
      pack.state.used=[...pack.state.recent];
      saveState(active,pack);
      usedSet=new Set(pack.state.used);
      remaining=[...valid].filter(w=>!usedSet.has(w));
    }

    if(remaining.length < reserve) return original.apply(context,args);

    const snapshot=DATA.slice();
    const filtered=snapshot.filter(entry =>
      !(entryMatchesGrade(entry,pack.grade) && usedSet.has(entry.word))
    );
    DATA.splice(0,DATA.length,...filtered);
    try {
      return original.apply(context,args);
    } finally {
      DATA.splice(0,DATA.length,...snapshot);
    }
  }

  function wrap(name,reserve){
    const original=API[name];
    if(typeof original!=='function' || original.__rotationWrapped) return;
    const wrapped=function(...args){ return runWithRotation(original,this,args,reserve); };
    wrapped.__rotationWrapped=true;
    API[name]=wrapped;
  }

  // Una partida necessita 10 paraules. Mantenim un marge més gran perquè el
  // selector adaptatiu continuï tenint opcions de dificultat i categories diverses.
  wrap('startPlay',24);
  wrap('startTraining',20);
  // "Practicar els meus errors" no es toca: repetir errors és precisament l’objectiu.

  let lastDisplayed=null;
  function captureDisplayedWord(){
    const title=APP.querySelector('.game-card .word-title');
    if(!title){ lastDisplayed=null; return; }
    const word=title.textContent.trim();
    if(word && word!==lastDisplayed){
      lastDisplayed=word;
      rememberWord(word);
    }
  }

  const observer=new MutationObserver(captureDisplayedWord);
  observer.observe(APP,{childList:true,subtree:true,characterData:true});
  captureDisplayedWord();
})();