(() => {
  const root = document.getElementById('adGrid');
  if (!root) return;
  const C = window.STORE_CONFIG || {};
  let rendering = false;
  let loaded = false;
  const timers = new WeakMap();
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&#039;',"'":'&#039;'}[x]));
  const price = b => b.is_free || Number(b.price) === 0 ? 'FREE' : `${Number(b.price).toLocaleString()} ${esc(b.currency || 'ETB')}`;
  function promoCard(b){return `<article class="promo-card" data-ads-book-id="${esc(b.id)}"><div class="promo-image">${b.cover_url?`<img src="${esc(b.cover_url)}" alt="${esc(b.title)}">`:'📚'}</div><div class="promo-action"><button class="btn primary" type="button" data-promo-id="${esc(b.id)}">View</button></div></article>`}
  function installScroller(row){
    if(!row||timers.has(row))return;
    let pausedUntil=0,dragging=false,startX=0,startScroll=0;
    const pause=()=>{pausedUntil=Date.now()+5000};
    row.addEventListener('touchstart',pause,{passive:true});
    row.addEventListener('pointerdown',e=>{pause();if(e.pointerType==='mouse'){dragging=true;startX=e.clientX;startScroll=row.scrollLeft;row.setPointerCapture?.(e.pointerId)}},{passive:true});
    row.addEventListener('pointermove',e=>{if(dragging)row.scrollLeft=startScroll-(e.clientX-startX)},{passive:true});
    row.addEventListener('pointerup',()=>{dragging=false},{passive:true});
    row.addEventListener('pointercancel',()=>{dragging=false},{passive:true});
    row.addEventListener('wheel',e=>{pause();if(Math.abs(e.deltaY)>Math.abs(e.deltaX)){e.preventDefault();row.scrollLeft+=e.deltaY}},{passive:false});
    timers.set(row,setInterval(()=>{if(dragging||Date.now()<pausedUntil)return;const cards=row.querySelectorAll('.promo-card'),max=row.scrollWidth-row.clientWidth;if(cards.length<2||max<=2)return;const gap=parseFloat(getComputedStyle(row).gap)||12,step=cards[0].getBoundingClientRect().width+gap,next=row.scrollLeft+step;row.scrollTo({left:next>=max-2?0:next,behavior:'smooth'})},5000));
  }
  function styleRow(row){row.style.cssText+=';display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;width:100%!important;overflow-x:auto!important;overflow-y:hidden!important;gap:12px!important;padding:4px 2px 12px!important;box-sizing:border-box!important;touch-action:pan-x!important;-webkit-overflow-scrolling:touch!important;scroll-behavior:smooth!important;scrollbar-width:none!important;';[...row.children].forEach(card=>{card.style.cssText+=';flex:0 0 clamp(210px,28vw,270px)!important;width:clamp(210px,28vw,270px)!important;min-width:clamp(210px,28vw,270px)!important;max-width:clamp(210px,28vw,270px)!important;box-sizing:border-box!important;';const image=card.querySelector('.promo-image');if(image)image.style.cssText+=';width:100%!important;height:clamp(240px,32vw,315px)!important;min-height:clamp(240px,32vw,315px)!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;background:#fff!important;padding:4px!important;box-sizing:border-box!important;';const img=card.querySelector('.promo-image img');if(img)img.style.cssText+=';width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;margin:auto!important;display:block!important;';});installScroller(row)}
  function renderSections(books){rendering=true;const paid=books.filter(b=>!b.is_free&&Number(b.price)!==0),free=books.filter(b=>b.is_free||Number(b.price)===0);root.innerHTML='';root.style.cssText+=';display:block!important;width:100%!important;';const add=(title,icon,list)=>{if(!list.length)return;const section=document.createElement('section');section.className='promo-section';section.style.cssText+=';display:block!important;width:100%!important;clear:both!important;margin:0 0 20px!important;';section.innerHTML=`<div class="promo-section-heading"><span>${icon}</span><h3>${title}</h3></div><div class="promo-section-grid"></div>`;const row=section.querySelector('.promo-section-grid');row.innerHTML=list.map(promoCard).join('');root.appendChild(section);styleRow(row)};add('Paid Books','💳',paid);add('Free Books','🆓',free);rendering=false}
  async function loadAds(){if(rendering||!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY)return;loaded=true;try{const sb=window.supabase?.createClient?.(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);if(!sb)throw new Error('Supabase client unavailable');const{data,error}=await sb.from('books').select('id,title,description,language,type,format,price,currency,is_free,cover_url,created_at,is_published').eq('is_published',true).order('created_at',{ascending:false});if(error)throw error;renderSections(Array.isArray(data)?data:[]);root.querySelectorAll('[data-promo-id]').forEach(btn=>{btn.onclick=e=>{e.preventDefault();e.stopPropagation();const fn=window.openBook;if(typeof fn==='function')fn(btn.dataset.promoId)}})}catch(e){console.error('Ads load failed:',e);loaded=false}}
  new MutationObserver(()=>{if(!rendering&&!root.querySelector('.promo-section')){loaded=false;requestAnimationFrame(loadAds)}}).observe(root,{childList:true});
  setTimeout(loadAds,250);
})();
