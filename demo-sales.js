/* Paid-book reader social proof.
   Uses the paid-card reader counter already maintained by app.js.
   Only decorates #grid paid-book cards. */
(function(){
  const seedFor=id=>{let h=0;for(let i=0;i<String(id).length;i++)h=(h*31+String(id).charCodeAt(i))>>>0;return 1101+(h%700)};
  const countFor=id=>{
    const key=`reader-count-${id}`;
    const stored=Number(localStorage.getItem(key));
    if(Number.isFinite(stored)&&stored>=1101)return stored;
    const seed=seedFor(id);
    try{localStorage.setItem(key,String(seed))}catch{}
    return seed;
  };
  const decorate=()=>document.querySelectorAll('#grid .book').forEach(card=>{
    const id=card.getAttribute('data-book-card');
    if(!id)return;
    let badge=card.querySelector('.demo-sales-badge');
    if(!badge){
      badge=document.createElement('div');
      badge.className='demo-sales-badge';
      const body=card.querySelector('.body');
      const bottom=body?.querySelector('.bottom');
      if(body)body.insertBefore(badge,bottom||null);
    }
    badge.textContent=`👥 ${countFor(id).toLocaleString()}+ readers exploring`;
  });
  const refresh=()=>decorate();
  const observer=new MutationObserver(refresh);
  const start=()=>{const grid=document.getElementById('grid');if(grid)observer.observe(grid,{childList:true,subtree:true});decorate();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.addEventListener('storage',refresh);
  setInterval(refresh,1500);
})();
