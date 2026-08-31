(function(){
  const style=document.createElement('style');
  style.id='book-ui-exact';
  style.textContent=`
    /* AVAILABLE BOOKS ONLY: compact title-list rows. Do not show covers/descriptions here. */
    #grid{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;align-items:stretch!important}
    #grid .book{display:block!important;min-width:0!important;width:100%!important;margin:0!important;border:1px solid var(--line)!important;border-left:4px solid var(--green)!important;border-radius:12px!important;background:#fff!important;box-shadow:0 4px 14px #2f1f120c!important;overflow:hidden!important;position:relative!important}
    #grid .book:nth-child(3n+2){border-left-color:var(--gold)!important}
    #grid .book:nth-child(3n){border-left-color:var(--red)!important}
    #grid .book .cover,#grid .book .badge,#grid .book .book-preview{display:none!important}
    #grid .book .body{display:flex!important;align-items:center!important;gap:12px!important;padding:0!important;min-width:0!important;width:100%!important}
    #grid .book .title{display:block!important;flex:1 1 auto!important;min-width:0!important;margin:0!important;padding:14px 14px!important;cursor:default!important;font-family:"Noto Sans Ethiopic",sans-serif!important;font-size:16px!important;line-height:1.4!important;font-weight:700!important;overflow-wrap:anywhere!important;word-break:normal!important}
    #grid .book .bottom{display:flex!important;align-items:center!important;justify-content:flex-end!important;flex:0 0 auto!important;gap:12px!important;margin:0!important;padding:8px 12px 8px 0!important;position:relative!important;z-index:40!important;pointer-events:auto!important}
    #grid .book .bottom>b{white-space:nowrap!important;font-size:14px!important}
    #grid .book .bottom .btn{display:inline-flex!important;position:relative!important;z-index:50!important;pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;width:auto!important;min-width:68px!important;margin:0!important;min-height:38px!important;padding:9px 14px!important;font-size:13px!important}
    #grid .book.expanded{grid-column:auto!important}

    /* Free Books: keep the existing compact title-list behavior. */
    #freeGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;align-items:start!important}
    #freeGrid .book{min-width:0!important;margin:0!important;border:1px solid var(--line)!important;border-top:3px solid var(--green)!important;border-radius:16px!important;background:#fff!important;box-shadow:0 6px 18px #2f1f120c!important;overflow:hidden!important}
    #freeGrid .book:nth-child(3n+2){border-top-color:var(--gold)!important}
    #freeGrid .book:nth-child(3n){border-top-color:var(--red)!important}
    #freeGrid .book .cover{display:none!important}
    #freeGrid .book .body{padding:0!important}
    #freeGrid .book .badge{display:none!important}
    #freeGrid .book .title{margin:0!important;padding:13px 14px!important;min-height:58px!important;display:flex!important;align-items:center!important;cursor:pointer!important;font-size:16px!important;line-height:1.3!important;font-weight:700!important;overflow-wrap:anywhere!important}
    #freeGrid .book .title:hover{background:linear-gradient(90deg,#168a4b0b,#f0c4190b,#c83c3210)!important}
    #freeGrid .book.expanded{grid-column:1/-1!important}
    #freeGrid .book .book-preview{padding:14px!important}
    #freeGrid .book .book-preview[hidden]{display:none!important}
    #freeGrid .book .book-preview .desc{min-height:0!important;margin:0 0 10px!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
    #freeGrid .book .bottom{display:none!important}
    #freeGrid .book .book-preview .book-view-button{display:inline-flex!important;width:auto!important;min-width:120px!important;position:relative!important;z-index:20!important;pointer-events:auto!important;cursor:pointer!important}
    #freeGrid .book .free-access-result{margin-top:12px!important}
    #freeGrid .book .free-access-result[hidden]{display:none!important}

    /* Ads View buttons only. */
    #adGrid .promo-image{display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;background:transparent!important;padding:0!important;border-radius:12px!important}
    #adGrid .promo-image img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;margin:auto!important;border-radius:10px!important;box-shadow:none!important}
    #adGrid .promo-overlay{display:none!important;visibility:hidden!important}
    #adGrid .promo-action{padding:0 4px 8px!important;position:relative!important;z-index:20!important}
    #adGrid .promo-action .btn{position:relative!important;z-index:21!important;pointer-events:auto!important;cursor:pointer!important}

    @media(max-width:700px){
      #grid{gap:8px!important}
      #grid .book .body{gap:6px!important}
      #grid .book .title{font-size:14px!important;padding:12px 10px!important}
      #grid .book .bottom{gap:7px!important;padding:6px 8px 6px 0!important}
      #grid .book .bottom>b{font-size:12px!important}
      #grid .book .bottom .btn{min-width:58px!important;min-height:36px!important;padding:8px 10px!important;font-size:12px!important}
    }
    @media(max-width:520px){
      #grid .book{border-radius:10px!important}
      #grid .book .body{align-items:stretch!important}
      #grid .book .title{font-size:13px!important;padding:11px 9px!important}
      #grid .book .bottom{flex-direction:column!important;justify-content:center!important;gap:4px!important;padding:6px 7px!important}
      #grid .book .bottom>b{font-size:11px!important}
      #grid .book .bottom .btn{min-width:56px!important;min-height:34px!important;padding:7px 9px!important;font-size:11px!important}
      #freeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #freeGrid .book{border-radius:14px!important}
      #freeGrid .book .title{font-size:14px!important;padding:11px 10px!important;min-height:52px!important}
      #freeGrid .book .book-preview{padding:11px!important}
      #freeGrid .book .book-preview .book-view-button{min-width:100px!important;font-size:13px!important}
    }
  `;
  document.head.appendChild(style);

  function collapse(scope,except){scope.querySelectorAll('.book.expanded').forEach(other=>{if(other!==except){other.classList.remove('expanded');const p=other.querySelector('.book-preview');if(p)p.hidden=true;}})}
  function wireFreeTitle(card,preview,scope){
    const title=card.querySelector('.title');if(!title||!preview)return;
    const toggle=()=>{const opening=!card.classList.contains('expanded');collapse(scope,card);card.classList.toggle('expanded',opening);preview.hidden=!opening;};
    title.setAttribute('role','button');title.setAttribute('tabindex','0');
    title.onclick=e=>{e.preventDefault();e.stopPropagation();toggle()};
    title.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
  }
  function moveFreeAction(card,preview){const old=card.querySelector('[data-card-view]');if(old&&!old.dataset.freeActionMoved){old.dataset.freeActionMoved='1';old.style.display='inline-flex';old.classList.add('book-view-button');old.type='button';preview.appendChild(old);}}
  function enhanceFree(){const scope=document.querySelector('#freeGrid');if(!scope)return;scope.querySelectorAll('.book').forEach(card=>{const preview=card.querySelector('.book-preview');if(!preview||card.dataset.freeUiReady)return;card.dataset.freeUiReady='1';preview.hidden=true;moveFreeAction(card,preview);wireFreeTitle(card,preview,scope);});}
  const observer=new MutationObserver(enhanceFree);observer.observe(document.body,{childList:true,subtree:true});enhanceFree();

  /* Paid-book View safety fix: desktop/laptop-safe delegated handler. */
  let paidPointerHandled=false;
  document.addEventListener('pointerdown',function(e){
    const button=e.target.closest?.('#grid [data-card-view]');
    if(!button)return;
    paidPointerHandled=true;
    e.preventDefault();e.stopPropagation();
    const id=button.getAttribute('data-id');
    if(id && typeof window.openBook==='function') window.openBook(id);
    setTimeout(()=>{paidPointerHandled=false},350);
  },true);
  document.addEventListener('click',function(e){
    const button=e.target.closest?.('#grid [data-card-view]');
    if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(paidPointerHandled)return;
    const id=button.getAttribute('data-id');
    if(id && typeof window.openBook==='function') window.openBook(id);
  },true);
})();
