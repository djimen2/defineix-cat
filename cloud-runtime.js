(() => {
  'use strict';
  const API=window.Defineix;
  if(!API) return;
  const DB_KEY='defineix_v01';
  const GUARD='defineix_cloud_refresh_guard_v1';
  function active(){
    try{
      const db=JSON.parse(localStorage.getItem(DB_KEY))||{};
      return db.activeCode && db.profiles ? db.profiles[db.activeCode] || null : null;
    }catch(e){ return null; }
  }
  const before=JSON.stringify(active());
  const guarded=sessionStorage.getItem(GUARD)==='1';
  if(guarded) sessionStorage.removeItem(GUARD);
  else setTimeout(()=>{
    const afterProfile=active(), after=JSON.stringify(afterProfile);
    if(before!==after && afterProfile?.cloud?.deviceToken && !document.querySelector('.game-card')){
      sessionStorage.setItem(GUARD,'1');
      location.reload();
    }
  },1400);

  const dismiss=API.cloudDismissWelcome;
  API.cloudDismissWelcome=function(...args){
    const result=typeof dismiss==='function'?dismiss.apply(this,args):undefined;
    document.querySelector('.cloud-welcome-banner')?.remove();
    return result;
  };

  function keepWelcomeOnDashboard(){
    const banner=document.querySelector('.cloud-welcome-banner');
    if(!banner) return;
    const heading=banner.closest('.screen')?.querySelector('.section-head h1')?.textContent || '';
    if(!heading.trim().startsWith('Hola,')) banner.remove();
  }
  const observer=new MutationObserver(keepWelcomeOnDashboard);
  observer.observe(document.getElementById('app'),{childList:true,subtree:true});
  keepWelcomeOnDashboard();
})();
