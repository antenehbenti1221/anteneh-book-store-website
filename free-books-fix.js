/* Free Books: one-title-at-a-time accordion + inline free access.
   This deliberately keeps free access out of My Purchases visually and prevents the paid checkout modal from being used. */
(function(){
  const C=window.STORE_CONFIG||{};
  let freeClient=null;
  const esc=s=>String(s??'').replace(/[&<>\"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[x]));

  function getClient(){
    if(!freeClient && window.supabase && C.SUPABASE_URL && C.SUPABASE_PUBLISHABLE_KEY){
      freeClient=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);
    }
    return freeClient;
  }

  function collapseOthers(card){
    document.querySelectorAll('#freeGrid .book.expanded').forEach(other=>{
      if(other===card)return;
      other.classList.remove('expanded');
      const p=other.querySelector('.book-preview');
      if(p)p.hidden=true;
      const b=other.querySelector('[data-card-view]');
      if(b && !b.dataset.ready) b.textContent='📖 Read / Listen Free';
    });
  }

  async function openFree(card,button){
    const preview=card.querySelector('.book-preview');
    if(!preview)return;
    let result=preview.querySelector('.free-access-result');
    if(!result){
      result=document.createElement('div');
      result.className='free-access-result';
      preview.appendChild(result);
    }
    if(result.dataset.ready==='1')return;
    const id=button.dataset.id;
    if(!id)return;
    const c=getClient();
    if(!c){
      result.hidden=false;
      result.innerHTML='<p class="small-note">Store connection is not available. Please refresh.</p>';
      return;
    }
    button.disabled=true;
    button.textContent='Preparing…';
    result.hidden=false;
    result.innerHTML='<p class="small-note">Preparing your free book…</p>';
    try{
      const {data,error}=await c.rpc('create_store_order',{
        p_book_id:id,
        p_customer_name:'Free reader',
        p_customer_email:null,
        p_customer_phone:null
      });
      if(error)throw error;
      const o=Array.isArray(data)?data[0]:data;
      if(!o || !o.access_token)throw new Error('Free access token was not returned');
      const kind=(card.textContent||'').toLowerCase().includes('audio')?'audio':'ebook';
      const r=await fetch(`${C.SUPABASE_URL}/functions/v1/deliver-purchase`,{
        method:'POST',
        headers:{'Content-Type':'application/json',apikey:C.SUPABASE_PUBLISHABLE_KEY},
        body:JSON.stringify({access_token:o.access_token,kind})
      });
      const j=await r.json();
      if(!r.ok || !j.url)throw new Error(j.error||'Secure access link was not returned');
      result.dataset.ready='1';
      result.innerHTML=`<a class="btn primary" href="${esc(j.url)}" target="_blank" rel="noopener">${kind==='audio'?'🎧 Open audiobook':'📖 Open ebook'}</a>`;
      button.dataset.ready='1';
      button.textContent='Ready';
    }catch(e){
      result.innerHTML=`<p class="small-note">Could not open this book.</p><button class="btn" type="button" data-free-retry>Try again</button>`;
      result.querySelector('[data-free-retry]').onclick=()=>openFree(card,button);
      button.disabled=false;
      button.textContent='📖 Read / Listen Free';
    }
  }

  function prepareCard(card){
    if(card.dataset.freeFixReady==='1')return;
    const title=card.querySelector('.title');
    const preview=card.querySelector('.book-preview');
    const button=card.querySelector('[data-card-view]');
    if(!title || !preview || !button)return;
    card.dataset.freeFixReady='1';
    preview.hidden=true;
    const bottom=card.querySelector('.bottom');
    if(bottom)bottom.style.display='none';
    button.classList.add('book-view-button');
    button.textContent='📖 Read / Listen Free';
    button.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      collapseOthers(card);
      card.classList.add('expanded');
      preview.hidden=false;
      openFree(card,button);
    };
    title.setAttribute('role','button');
    title.setAttribute('tabindex','0');
    title.onclick=function(e){
      e.preventDefault();
      e.stopPropagation();
      const wasOpen=card.classList.contains('expanded');
      collapseOthers(card);
      card.classList.toggle('expanded',!wasOpen);
      preview.hidden=wasOpen;
    };
    title.onkeydown=function(e){
      if(e.key==='Enter'||e.key===' '){e.preventDefault();title.click();}
    };
  }

  function hideFreeOrders(){
    const freeTitles=new Set([...document.querySelectorAll('#freeGrid .book .title')].map(x=>x.textContent.trim().toLowerCase()));
    if(!freeTitles.size)return;
    document.querySelectorAll('#orderStatus .order-card').forEach(card=>{
      const title=card.querySelector('h3')?.textContent.trim().toLowerCase();
      if(title && freeTitles.has(title)){
        card.style.display='none';
      }
    });
    const list=document.querySelector('#orderStatus .orders-list');
    if(list && [...list.children].every(x=>getComputedStyle(x).display==='none')){
      list.innerHTML='<p>You have no purchases yet.</p>';
    }
  }

  function run(){
    document.querySelectorAll('#freeGrid .book').forEach(prepareCard);
    hideFreeOrders();
  }

  const obs=new MutationObserver(run);
  obs.observe(document.body,{childList:true,subtree:true});
  run();
})();
