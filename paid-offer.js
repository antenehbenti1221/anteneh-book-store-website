(function(){
  const HOURS=24;
  const stateKey=id=>'paid-offer-start-'+id;
  const money=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
  const originalPrice=n=>Number(n)/0.70;
  function addCardOffer(card){
    if(!card||card.dataset.paidOfferReady)return;
    if(!document.querySelector('#grid')?.contains(card))return;
    card.dataset.paidOfferReady='1';
    const body=card.querySelector('.body');
    const title=card.querySelector('.title');
    if(!body||!title)return;
    const priceEl=card.querySelector('.bottom b');
    const text=priceEl?.textContent||'';
    const m=text.match(/([0-9,.]+)\s*([A-Za-z]+)?/);
    if(!m)return;
    const p=Number(m[1].replace(/,/g,''));
    if(!p)return;
    const cur=m[2]||'ETB';
    const offer=document.createElement('div');
    offer.className='paid-offer-badge';
    offer.innerHTML='<strong>30% OFF</strong><span><s>'+money(originalPrice(p))+' '+cur+'</s> '+money(p)+' '+cur+'</span>';
    title.insertAdjacentElement('afterend',offer);
  }
  function style(){
    if(document.getElementById('paid-offer-style'))return;
    const s=document.createElement('style');s.id='paid-offer-style';
    s.textContent=`
      #grid .paid-offer-badge{margin:7px 0 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;line-height:1.3}
      #grid .paid-offer-badge strong{display:inline-block;padding:4px 7px;border-radius:999px;background:#b42318;color:#fff;font-size:11px;letter-spacing:.03em}
      #grid .paid-offer-badge span{font-weight:600}
      #grid .paid-offer-badge s{opacity:.6;font-weight:500;margin-right:3px}
      .paid-offer-box{margin:14px 0;padding:14px;border-radius:14px;border:1px solid rgba(180,35,24,.22);background:rgba(180,35,24,.06)}
      .paid-offer-box .offer-row{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
      .paid-offer-box .offer-label{font-weight:800}
      .paid-offer-box .offer-price{font-weight:800}
      .paid-offer-box .offer-price s{opacity:.55;font-weight:500;margin-right:6px}
      .paid-offer-box .offer-timer{margin-top:8px;font-weight:800;font-variant-numeric:tabular-nums}
      .paid-offer-box.expired{border-color:rgba(80,80,80,.2);background:rgba(80,80,80,.05)}
    `;document.head.appendChild(s);
  }
  function getStart(id){const v=Number(localStorage.getItem(stateKey(id)));return Number.isFinite(v)&&v>0?v:null}
  function setStart(id,ms){localStorage.setItem(stateKey(id),String(ms))}
  async function startOffer(id){
    try{
      if(!window.supabase||!window.STORE_CONFIG)return null;
      const client=window.supabase.createClient(window.STORE_CONFIG.SUPABASE_URL,window.STORE_CONFIG.SUPABASE_PUBLISHABLE_KEY);
      const {data,error}=await client.rpc('start_book_offer',{p_book_id:id});
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(row?.started_at){const ms=new Date(row.started_at).getTime();setStart(id,ms);return ms}
    }catch(e){console.warn('Offer timer unavailable:',e.message)}
    return getStart(id);
  }
  function showOffer(b,start){
    const details=document.querySelector('#details');if(!details||!b)return;
    document.querySelector('.paid-offer-box')?.remove();
    const box=document.createElement('div');box.className='paid-offer-box';
    const sale=Number(b.price), regular=originalPrice(sale),cur=b.currency||'ETB';
    box.innerHTML='<div class="offer-row"><span class="offer-label">30% OFF — 24-hour offer</span><span class="offer-price"><s>'+money(regular)+' '+cur+'</s>'+money(sale)+' '+cur+'</span></div><div class="offer-timer" id="paidOfferTimer">24:00:00 remaining</div>';
    const buy=document.querySelector('#buyNow');
    if(buy)buy.insertAdjacentElement('beforebegin',box);else details.appendChild(box);
    const timer=box.querySelector('#paidOfferTimer');
    function tick(){
      const left=Math.max(0,start+HOURS*3600000-Date.now());
      if(left<=0){
        box.classList.add('expired');
        box.querySelector('.offer-label').textContent='Offer expired';
        box.querySelector('.offer-price').innerHTML=money(regular)+' '+cur;
        timer.textContent='The 24-hour offer has ended.';
        clearInterval(iv);return;
      }
      const h=Math.floor(left/3600000),m=Math.floor(left%3600000/60000),s=Math.floor(left%60000/1000);
      timer.textContent=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' remaining';
    }
    tick();const iv=setInterval(tick,1000);
  }
  function decorate(){document.querySelectorAll('#grid .book').forEach(addCardOffer)}
  style();
  const observer=new MutationObserver(decorate);observer.observe(document.body,{childList:true,subtree:true});decorate();
  const original=window.openBook;
  if(typeof original==='function'){
    window.openBook=function(id){
      const b=window.books?.find?.(x=>String(x.id)===String(id));
      original(id);
      if(b&&!b.is_free){
        setTimeout(async()=>{const start=await startOffer(b.id);if(start)showOffer(b,start)},50);
      }
    };
  }
})();
