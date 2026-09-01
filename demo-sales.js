/* Honest social-proof counters for paid books.
   Demo values are explicitly labeled until real order data is available. */
(function(){
  const KEY='anteneh_demo_sales_v1';
  const getData=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const save=d=>{try{localStorage.setItem(KEY,JSON.stringify(d))}catch{}};
  const data=getData();
  const seedFor=id=>{let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;return 500+(h%301)};
  const decorate=()=>{
    document.querySelectorAll('#grid .book').forEach((card,i)=>{
      if(card.querySelector('.demo-sales-badge'))return;
      const title=card.querySelector('.title')?.textContent?.trim()||('book-'+i);
      const id=card.dataset.id||title;
      if(data[id]==null)data[id]={demo:seedFor(id),real:0};
      const real=data[id].real||0, demo=data[id].demo||seedFor(id);
      const badge=document.createElement('div');
      badge.className='demo-sales-badge';
      badge.textContent=`Demo sales: ${demo} · Actual orders: ${real}`;
      const body=card.querySelector('.body');
      const desc=body?.querySelector('.desc');
      if(body) body.insertBefore(badge,desc||body.querySelector('.bottom')||null);
    });
    save(data);
  };
  const incrementFromTitle=title=>{
    if(!title)return;
    const d=getData();
    Object.keys(d).forEach(id=>{if(id===title){d[id].real=(d[id].real||0)+1;}});
    save(d);decorate();
  };
  const observer=new MutationObserver(decorate);
  document.addEventListener('DOMContentLoaded',()=>{const grid=document.getElementById('grid');if(grid)observer.observe(grid,{childList:true,subtree:true});decorate();});
  document.addEventListener('submit',e=>{
    const form=e.target;
    if(!form.closest('#modal'))return;
    const heading=document.querySelector('#details .title, #details h2, #details h3');
    if(heading) setTimeout(()=>incrementFromTitle(heading.textContent.trim()),300);
  },true);
})();
