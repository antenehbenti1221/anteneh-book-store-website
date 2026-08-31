(function(){
  const style=document.createElement('style');
  style.id='book-ui-exact';
  style.textContent=`
    /* Available Books only: clean independent cards. */
    #grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:20px!important;align-items:start!important}
    #grid .book{display:block!important;min-width:0!important;width:100%!important;margin:0!important;border:1px solid var(--line)!important;border-top:3px solid var(--green)!important;border-radius:20px!important;background:#fff!important;box-shadow:0 8px 28px #2f1f120d!important;overflow:hidden!important;position:relative!important}
    #grid .book:nth-child(3n+2){border-top-color:var(--gold)!important}
    #grid .book:nth-child(3n){border-top-color:var(--red)!important}
    #grid .book .cover{display:grid!important;width:100%!important;height:250px!important;margin:0!important;overflow:hidden!important;position:relative!important;background:linear-gradient(145deg,#168a4b,#f0c419,#c83c32)!important}
    #grid .book .cover img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important}
    #grid .book .body{display:block!important;padding:20px!important;min-width:0!important}
    #grid .book .badge{display:block!important;margin:0!important;font-size:11px!important;line-height:1.3!important}
    #grid .book .title{display:block!important;margin:8px 0!important;padding:0!important;min-height:0!important;cursor:pointer!important;font-family:"Noto Sans Ethiopic",sans-serif!important;font-size:20px!important;line-height:1.35!important;font-weight:700!important;overflow-wrap:anywhere!important;word-break:normal!important}
    #grid .book .title:hover{background:none!important}
    #grid .book .book-preview{display:block!important;width:100%!important;box-sizing:border-box!important;padding:0!important;margin:0!important;min-width:0!important;overflow:visible!important}
    #grid .book .book-preview[hidden]{display:none!important}
    #grid .book .book-preview .desc{display:block!important;width:100%!important;min-width:0!important;min-height:0!important;margin:12px 0 10px!important;padding:0!important;color:var(--muted)!important;font-size:14px!important;line-height:1.65!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:normal!important;text-align:left!important}
    #grid .book .book-language{display:block!important;margin:8px 0!important;font-size:13px!important;line-height:1.5!important}
    #grid .book .bottom{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;margin-top:18px!important;padding:0!important;position:relative!important;z-index:40!important;pointer-events:auto!important}
    #grid .book .bottom .btn{display:inline-flex!important;position:relative!important;z-index:50!important;pointer-events:auto!important;cursor:pointer!important;touch-action:manipulation!important;width:auto!important;margin:0!important}
    #grid .book.expanded{grid-column:1/-1!important}
    #grid .book.expanded .title{border-bottom:1px solid var(--line)!important;padding-bottom:10px!important}

    /* Free Books: preserve its existing compact behavior. */
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

    @media(max-width:900px){
      #grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      #grid .book .cover{height:230px!important}
      #grid .book .body{padding:16px!important}
      #grid .book .title{font-size:17px!important}
      #freeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
      #freeGrid .book .title{font-size:15px!important;padding:12px!important;min-height:54px!important}
    }
    @media(max-width:520px){
      #grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #grid .book{border-radius:14px!important}
      #grid .book .cover{height:210px!important}
      #grid .book .body{padding:12px!important}
      #grid .book .title{font-size:15px!important}
      #grid .book .book-preview .desc{font-size:13px!important}
      #grid .book .bottom{align-items:stretch!important;flex-direction:column!important}
      #grid .book .bottom .btn{width:100%!important}
      #freeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #freeGrid .book{border-radius:14px!important}
      #freeGrid .book .title{font-size:14px!important;padding:11px 10px!important;min-height:52px!important}
      #freeGrid .book .book-preview{padding:11px!important}
      #freeGrid .book .book-preview .book-view-button{min-width:100px!important;font-size:13px!important}
    }
  `;
  document.head.appendChild(style);

  function collapse(scope,except){scope.querySelectorAll('.book.expanded').forEach(other=>{if(other!==except){other.classList.remove('expanded');const p=other.querySelector('.book-preview');if(p)p.hidden=true;}})}
  function wireTitle(card,preview,scope){
    const title=card.querySelector('.title');if(!title||!preview)return;
    const toggle=()=>{const opening=!card.classList.contains('expanded');collapse(scope,card);card.classList.toggle('expanded',opening);preview.hidden=!opening;};
    title.setAttribute('role','button');title.setAttribute('tabindex','0');
    title.onclick=e=>{e.preventDefault();e.stopPropagation();toggle()};
    title.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
  }
  function moveFreeAction(card,preview){const old=card.querySelector('[data-card-view]');if(old&&!old.dataset.freeActionMoved){old.dataset.freeActionMoved='1';old.style.display='inline-flex';old.classList.add('book-view-button');old.type='button';preview.appendChild(old);}}
  function enhanceGrid(){const scope=document.querySelector('#grid');if(!scope)return;scope.querySelectorAll('.book').forEach(card=>{const preview=card.querySelector('.book-preview');if(!preview||card.dataset.uiReady)return;card.dataset.uiReady='1';wireTitle(card,preview,scope);});}
  function enhanceFree(){const scope=document.querySelector('#freeGrid');if(!scope)return;scope.querySelectorAll('.book').forEach(card=>{const preview=card.querySelector('.book-preview');if(!preview||card.dataset.freeUiReady)return;card.dataset.freeUiReady='1';preview.hidden=true;moveFreeAction(card,preview);wireTitle(card,preview,scope);});}
  function enhance(){enhanceGrid();enhanceFree()}
  const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});enhance();

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
