(function(){
  const style=document.createElement('style');
  style.id='book-ui-exact';
  style.textContent=`
    #grid .book .cover{display:none}
    #grid .book .body{padding:0}
    #grid .book .badge,#grid .book .bottom{display:none}
    #grid .book .title{margin:0;padding:20px 22px;cursor:pointer;font-size:20px;line-height:1.35}
    #grid .book.expanded .title{border-bottom:1px solid var(--line)}
    #grid .book .book-preview{padding:0 22px 22px}
    #grid .book .book-preview[hidden]{display:none}
    #grid .book .book-preview .desc{min-height:0;margin:0 0 12px}
    #grid .book .book-preview .book-view-button{display:inline-flex}

    /* Free books: title-first accordion. The access button opens the book inline, not the purchase modal. */
    #freeGrid .book .cover{display:none}
    #freeGrid .book .body{padding:0}
    #freeGrid .book .badge,#freeGrid .book .bottom{display:none}
    #freeGrid .book .title{margin:0;padding:20px 22px;cursor:pointer;font-size:20px;line-height:1.35}
    #freeGrid .book.expanded .title{border-bottom:1px solid var(--line)}
    #freeGrid .book .book-preview{padding:0 22px 22px}
    #freeGrid .book .book-preview[hidden]{display:none}
    #freeGrid .book .book-preview .desc{min-height:0;margin:0 0 12px}
    #freeGrid .book .book-preview .book-view-button{display:inline-flex}
    #freeGrid .book .free-access-result{margin-top:14px}
    #freeGrid .book .free-access-result[hidden]{display:none}

    /* Ads: display the uploaded cover/mockup exactly as supplied.
       No generated title/price overlay, no crop, no extra frame. */
    #adGrid .promo-image{
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      overflow:visible!important;
      background:transparent!important;
      padding:0!important;
      border-radius:12px!important;
    }
    #adGrid .promo-image img{
      display:block!important;
      width:auto!important;
      height:auto!important;
      max-width:100%!important;
      max-height:100%!important;
      object-fit:contain!important;
      object-position:center!important;
      margin:auto!important;
      border-radius:0!important;
      box-shadow:none!important;
    }
    #adGrid .promo-overlay{display:none!important;visibility:hidden!important}
    #adGrid .promo-action{padding:0 4px 8px}
  `;
  document.head.appendChild(style);

  function enhanceGrid(){
    document.querySelectorAll('#grid .book').forEach(card=>{
      const title=card.querySelector('.title'),preview=card.querySelector('.book-preview');
      if(!title||!preview||title.dataset.uiReady)return;
      title.dataset.uiReady='1';
      const old=card.querySelector('[data-card-view]');
      if(old){old.style.display='inline-flex';old.classList.add('book-view-button');preview.appendChild(old)}
      title.setAttribute('role','button');
      title.setAttribute('tabindex','0');
      const toggle=()=>{
        document.querySelectorAll('#grid .book.expanded').forEach(other=>{
          if(other!==card){other.classList.remove('expanded');const p=other.querySelector('.book-preview');if(p)p.hidden=true}
        });
        const open=card.classList.toggle('expanded');
        preview.hidden=!open;
      };
      title.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});
      title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    });
  }

  async function openFreeInline(card,preview,button){
    const b=typeof books!=='undefined' ? books.find(x=>String(x.id)===String(button.dataset.id)) : null;
    if(!b)return;
    let result=preview.querySelector('.free-access-result');
    if(!result){result=document.createElement('div');result.className='free-access-result';preview.appendChild(result)}
    if(result.dataset.ready==='1')return;
    button.disabled=true;
    button.textContent='Preparing…';
    result.hidden=false;
    result.innerHTML='<p class="small-note">Preparing your free book…</p>';
    try{
      const {data,error}=await client.rpc('create_store_order',{p_book_id:b.id,p_customer_name:'Free reader',p_customer_email:null,p_customer_phone:null});
      if(error)throw error;
      const o=Array.isArray(data)?data[0]:data;
      const kind=String(b.type||'').toLowerCase().includes('audio')?'audio':'ebook';
      const r=await fetch(`${C.SUPABASE_URL}/functions/v1/deliver-purchase`,{method:'POST',headers:{'Content-Type':'application/json',apikey:C.SUPABASE_PUBLISHABLE_KEY},body:JSON.stringify({access_token:o.access_token,kind})});
      const j=await r.json();
      if(!r.ok||!j.url)throw new Error(j.error||'Secure access link was not returned');
      result.dataset.ready='1';
      result.innerHTML=`<a class="btn primary" href="${String(j.url).replace(/&/g,'&amp;').replace(/\"/g,'&quot;')}" target="_blank" rel="noopener">${kind==='audio'?'🎧 Open audiobook':'📖 Open ebook'}</a>`;
      button.textContent='Ready';
    }catch(e){
      result.innerHTML=`<p class="small-note">Could not open this book.</p><button class="btn" type="button" data-free-retry>Try again</button>`;
      result.querySelector('[data-free-retry]').onclick=()=>openFreeInline(card,preview,button);
      button.disabled=false;
      button.textContent='Read / Listen Free';
    }
  }

  function enhanceFree(){
    document.querySelectorAll('#freeGrid .book').forEach(card=>{
      const title=card.querySelector('.title'),preview=card.querySelector('.book-preview');
      if(!title||!preview||title.dataset.freeUiReady)return;
      title.dataset.freeUiReady='1';
      const old=card.querySelector('[data-card-view]');
      if(old){
        old.style.display='inline-flex';
        old.classList.add('book-view-button');
        old.textContent='📖 Read / Listen Free';
        old.onclick=e=>{e.preventDefault();e.stopPropagation();openFreeInline(card,preview,old)};
        preview.appendChild(old);
      }
      title.setAttribute('role','button');
      title.setAttribute('tabindex','0');
      const toggle=()=>{
        document.querySelectorAll('#freeGrid .book.expanded').forEach(other=>{
          if(other!==card){
            other.classList.remove('expanded');
            const p=other.querySelector('.book-preview');
            if(p)p.hidden=true;
          }
        });
        const open=card.classList.toggle('expanded');
        preview.hidden=!open;
      };
      title.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});
      title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}});
    });
  }

  function enhance(){enhanceGrid();enhanceFree()}
  const observer=new MutationObserver(enhance);
  observer.observe(document.getElementById('grid')||document.body,{childList:true,subtree:true});
  observer.observe(document.getElementById('freeGrid')||document.body,{childList:true,subtree:true});
  enhance();
})();
