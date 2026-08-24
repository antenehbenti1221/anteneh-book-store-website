(function(){
const grid=document.getElementById('adGrid');
if(!grid)return;
let timer=null,signature='',index=0,track,items=[],dots,updating=false;
const gap=16;
function visibleCount(){return window.innerWidth<=700?2:3}
function maxIndex(){return Math.max(0,items.length-visibleCount())}
function setup(){if(updating)return;const cards=[...grid.querySelectorAll('.promo-card')];if(cards.length<2){clearTimeout(timer);grid.classList.remove('ads-carousel');return}const sig=cards.map(x=>x.dataset.promoId||x.querySelector('h3')?.textContent||'').join('|');if(sig===signature&&track)return;signature=sig;index=Math.min(index,maxIndex());clearTimeout(timer);updating=true;grid.classList.add('ads-carousel');grid.innerHTML='';track=document.createElement('div');track.className='ads-track';cards.forEach(c=>track.appendChild(c));grid.appendChild(track);const controls=document.createElement('div');controls.className='ads-controls';const prev=document.createElement('button');prev.className='ads-arrow';prev.type='button';prev.setAttribute('aria-label','Previous promotion');prev.textContent='‹';const next=document.createElement('button');next.className='ads-arrow';next.type='button';next.setAttribute('aria-label','Next promotion');next.textContent='›';dots=document.createElement('div');dots.className='ads-dots';controls.append(prev,dots,next);grid.appendChild(controls);items=[...track.children];const dotCount=maxIndex()+1;for(let i=0;i<dotCount;i++){const d=document.createElement('button');d.type='button';d.className='ads-dot';d.setAttribute('aria-label',`Promotion ${i+1}`);d.onclick=()=>{index=i;pause();go()};dots.appendChild(d)}prev.onclick=()=>{index=index<=0?maxIndex():index-1;pause();go()};next.onclick=()=>{index=index>=maxIndex()?0:index+1;pause();go()};let startX=0;grid.ontouchstart=e=>{startX=e.changedTouches[0].clientX;pause()};grid.ontouchend=e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>35){index=dx<0?(index>=maxIndex()?0:index+1):(index<=0?maxIndex():index-1);go()}};go();timer=setTimeout(auto,5000);updating=false}
function go(){if(!track||!items.length)return;const count=Math.min(visibleCount(),items.length);const cardWidth=items[0].getBoundingClientRect().width;track.style.transform=`translateX(-${index*(cardWidth+gap)}px)`;items.forEach((x,i)=>x.classList.toggle('ads-active',i>=index&&i<index+count));[...dots?.children||[]].forEach((d,i)=>d.classList.toggle('active',i===index))}
function pause(){clearTimeout(timer);timer=setTimeout(auto,7000)}
function auto(){index=index>=maxIndex()?0:index+1;go();timer=setTimeout(auto,5000)}
new MutationObserver(()=>{if(!updating){track=null;setup()}}).observe(grid,{childList:true});
window.addEventListener('resize',()=>{if(track)go()});
setTimeout(setup,300);
})();