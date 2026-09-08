(() => {
  'use strict';

  const DATA = window.DEFINEIX_DATA;
  const API = window.Defineix;
  const APP = document.getElementById('app');
  if (!Array.isArray(DATA) || !API || !APP) return;

  const DB_KEY = 'defineix_v01';
  const RECENT_KEY = 'defineix_recent_words_v1';
  const MAX_RECENT = 24;

  function loadGameDB(){
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || {}; }
    catch(e){ return {}; }
  }
  function loadRecentDB(){
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch(e){ return {}; }
  }
  function saveRecentDB(value){
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(value)); }
    catch(e){}
  }
  function activeProfile(){
    const db = loadGameDB();
    const code = db.activeCode;
    const profile = code && db.profiles ? db.profiles[code] : null;
    return profile ? {code, profile} : null;
  }
  function recentFor(code){
    const store = loadRecentDB();
    return Array.isArray(store[code]) ? store[code].slice(-MAX_RECENT) : [];
  }
  function setRecent(code, words){
    const store = loadRecentDB();
    store[code] = words.slice(-MAX_RECENT);
    saveRecentDB(store);
  }
  function seedRecentIfNeeded(){
    const active = activeProfile();
    if (!active) return [];
    let recent = recentFor(active.code);
    if (recent.length) return recent;

    const seen = Array.isArray(active.profile.seen) ? active.profile.seen : [];
    const seeded = [];
    for (const id of seen.slice(-MAX_RECENT * 2)) {
      const entry = DATA.find(item => item.id === id);
      if (entry && entry.word && !seeded.includes(entry.word)) seeded.push(entry.word);
    }
    recent = seeded.slice(-MAX_RECENT);
    if (recent.length) setRecent(active.code, recent);
    return recent;
  }
  function rememberWord(word){
    const active = activeProfile();
    if (!active || !word) return;
    const clean = String(word).trim();
    if (!clean) return;
    let recent = recentFor(active.code).filter(item => item !== clean);
    recent.push(clean);
    setRecent(active.code, recent);
  }

  function entryMatchesGrade(entry, grade){
    return Array.isArray(entry.grades) && entry.grades.includes(Number(grade));
  }

  function runWithoutRecent(original, context, args, reserve){
    const active = activeProfile();
    if (!active) return original.apply(context, args);

    const grade = Number(active.profile.grade);
    const recent = seedRecentIfNeeded();
    if (!recent.length) return original.apply(context, args);

    const eligible = DATA.filter(entry => entryMatchesGrade(entry, grade));
    const minimumPool = Math.max(reserve, 12);
    const maxRemovable = Math.max(0, eligible.length - minimumPool);
    if (!maxRemovable) return original.apply(context, args);

    const eligibleWords = new Set(eligible.map(entry => entry.word));
    const recentEligibleNewestFirst = [...recent]
      .reverse()
      .filter((word, index, arr) => eligibleWords.has(word) && arr.indexOf(word) === index);

    const wordsToHide = new Set(recentEligibleNewestFirst.slice(0, maxRemovable));
    if (!wordsToHide.size) return original.apply(context, args);

    const snapshot = DATA.slice();
    const filtered = snapshot.filter(entry =>
      !(entryMatchesGrade(entry, grade) && wordsToHide.has(entry.word))
    );

    DATA.splice(0, DATA.length, ...filtered);
    try {
      return original.apply(context, args);
    } finally {
      DATA.splice(0, DATA.length, ...snapshot);
    }
  }

  function wrap(name, reserve){
    const original = API[name];
    if (typeof original !== 'function' || original.__antiRepeatWrapped) return;
    const wrapped = function(...args){
      return runWithoutRecent(original, this, args, reserve);
    };
    wrapped.__antiRepeatWrapped = true;
    API[name] = wrapped;
  }

  // Jugar i Entrenar eviten les últimes 24 paraules sempre que el banc del curs
  // tingui prou alternatives. "Practicar els meus errors" no es filtra expressament,
  // perquè en aquell mode sí que interessa recuperar paraules fallades.
  wrap('startPlay', 18);
  wrap('startTraining', 16);

  let lastDisplayed = null;
  function captureDisplayedWord(){
    const title = APP.querySelector('.game-card .word-title');
    if (!title) {
      lastDisplayed = null;
      return;
    }
    const word = title.textContent.trim();
    if (word && word !== lastDisplayed) {
      lastDisplayed = word;
      rememberWord(word);
    }
  }

  const observer = new MutationObserver(captureDisplayedWord);
  observer.observe(APP, {childList:true, subtree:true, characterData:true});
  seedRecentIfNeeded();
  captureDisplayedWord();
})();