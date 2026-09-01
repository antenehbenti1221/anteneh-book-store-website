/* Paid-book reader display. Only affects paid cards in #grid. */
(function(){
  const seedFor=id=>{let h=0;for(const c of String(id||''))h=(h*31+c.charCodeAt(0))>>>0;return 1101+(h%700)};
  const countFor=id=>{
    const key=`reader-count-${id}`;
    const stored=parseInt(localStorage.getItem(key),10);
    const value=Number.isFinite(stored)&&stored>=1101?stored:seedFor(id);
    try{localStorage.setItem(key,String(value))}catch{}
    return value;
  };
  function decorate(){
    document.querySelectorAll('#grid .book').forEach(card=>{
      const id=card.getAttribute('data-book-card');
      if(!id)return;
      let badge=card.querySelector('.demo-sales-badge');
      if(!badge){badge=document.createElement('span');badge.className='demo-sales-badge reader-count';const title=card.querySelector('.title');if(title)title.insertAdjacentElement('afterend',badge);}
      badge.textContent=`👥 ${countFor(id).toLocaleString()}+ readers exploring`;
    });
  }
  const start=()=>{const grid=document.getElementById('grid');if(grid)new MutationObserver(decorate).observe(grid,{childList:true,subtree:true});decorate();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
