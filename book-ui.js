(function(){
  const style=document.createElement('style');
  style.id='book-ui-exact';
  style.textContent=`
    /* Compact customer book catalogue only. Other pages/features are untouched. */
    #grid,#freeGrid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important;align-items:start!important}
    #grid .book,#freeGrid .book{min-width:0!important;margin:0!important;border:1px solid var(--line)!important;border-top:3px solid var(--green)!important;border-radius:16px!important;background:#fff!important;box-shadow:0 6px 18px #2f1f120c!important;overflow:hidden!important}
    #grid .book:nth-child(3n+2),#freeGrid .book:nth-child(3n+2){border-top-color:var(--gold)!important}
    #grid .book:nth-child(3n),#freeGrid .book:nth-child(3n){border-top-color:var(--red)!important}
    #grid .book .cover,#freeGrid .book .cover{display:none!important}
    #grid .book .body,#freeGrid .book .body{padding:0!important}
    #grid .book .badge,#grid .book .bottom,#freeGrid .book .badge,#freeGrid .book .bottom{display:none!important}
    #grid .book .title,#freeGrid .book .title{margin:0!important;padding:13px 14px!important;min-height:58px!important;display:flex!important;align-items:center!important;cursor:pointer!important;font-size:16px!important;line-height:1.3!important;font-weight:700!important;overflow-wrap:anywhere!important}
    #grid .book .title:hover,#freeGrid .book .title:hover{background:linear-gradient(90deg,#168a4b0b,#f0c4190b,#c83c320b)!important}
    #grid .book.expanded,#freeGrid .book.expanded{grid-column:1/-1!important}
    #grid .book.expanded .title,#freeGrid .book.expanded .title{border-bottom:1px solid var(--line)!important;background:linear-gradient(90deg,#168a4b0b,#f0c4190b,#c83c320b)!important}
    #grid .book .book-preview,#freeGrid .book .book-preview{padding:14px!important}
    #grid .book .book-preview[hidden],#freeGrid .book .book-preview[hidden]{display:none!important}
    #grid .book .book-preview .desc,#freeGrid .book .book-preview .desc{min-height:0!important;margin:0 0 10px!important}
    #grid .book .book-preview .book-view-button,#freeGrid .book .book-preview .book-view-button{display:inline-flex!important;width:auto!important;min-width:120px!important;position:relative!important;z-index:20!important;pointer-events:auto!important;cursor:pointer!important}
    #freeGrid .book .free-access-result{margin-top:12px!important}
    #freeGrid .book .free-access-result[hidden]{display:none!important}

    #adGrid .promo-image{display:flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important;background:transparent!important;padding:0!important;border-radius:12px!important}
    #adGrid .promo-image img{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;margin:auto!important;border-radius:0!important;box-shadow:none!important}
    #adGrid .promo-overlay{display:none!important;visibility:hidden!important}
    #adGrid .promo-action{padding:0 4px 8px;position:relative!important;z-index:20!important}
    #adGrid .promo-action .btn{position:relative!important;z-index:21!important;pointer-events:auto!important;cursor:pointer!important}

    @media(max-width:900px){
      #grid,#freeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}
      #grid .book .title,#freeGrid .book .title{font-size:15px!important;padding:12px!important;min-height:54px!important}
    }
    @media(max-width:520px){
      #grid,#freeGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      #grid .book,#freeGrid .book{border-radius:14px!important}
      #grid .book .title,#freeGrid .book .title{font-size:14px!important;padding:11px 10px!important;min-height:52px!important}
      #grid .book .book-preview,#freeGrid .book .book-preview{padding:11px!important}
      #grid .book .book-preview .book-view-button,#freeGrid .book .book-preview .book-view-button{min-width:100px!important;font-size:13px!important}
    }
  `;
  document.head.appendChild(style);

  function collapse(scope,except){
    scope.querySelectorAll('.book.expanded').forEach(other=>{
      if(other!==except){
        other.classList.remove('expanded');
        const p=other.querySelector('.book-preview');
        if(p)p.hidden=true;
      }
    });
  }

  function wireTitle(card,preview,scope){
    const title=card.querySelector('.title');
    if(!title||!preview)return;
    const toggle=()=>{
      const opening=!card.classList.contains('expanded');
      collapse(scope,card);
      card.classList.toggle('expanded',opening);
      preview.hidden=!opening;
    };
    title.setAttribute('role','button');
    title.setAttribute('tabindex','0');
    title.onclick=e=>{e.preventDefault();e.stopPropagation();toggle()};
    title.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}};
  }

  function moveAction(card,preview){
    const old=card.querySelector('[data-card-view]');
    if(old&&!old.dataset.freeActionMoved){
      old.dataset.freeActionMoved='1';
      old.style.display='inline-flex';
      old.classList.add('book-view-button');
      old.type='button';
      preview.appendChild(old);
    }
  }

  function enhanceGrid(){
    const scope=document.querySelector('#grid');
    if(!scope)return;
    scope.querySelectorAll('.book').forEach(card=>{
      const preview=card.querySelector('.book-preview');
      if(!preview||card.dataset.uiReady)return;
      card.dataset.uiReady='1';
      moveAction(card,preview);
      wireTitle(card,preview,scope);
    });
  }

  function enhanceFree(){
    const scope=document.querySelector('#freeGrid');
    if(!scope)return;
    scope.querySelectorAll('.book').forEach(card=>{
      const preview=card.querySelector('.book-preview');
      if(!preview||card.dataset.freeUiReady)return;
      card.dataset.freeUiReady='1';
      preview.hidden=true;
      moveAction(card,preview);
      wireTitle(card,preview,scope);
    });
  }

  function enhance(){enhanceGrid();enhanceFree()}
  const observer=new MutationObserver(enhance);
  observer.observe(document.body,{childList:true,subtree:true});
  enhance();

  /* Safety handler: reliably forwards the real button click after this UI layer moves it. */
  document.addEventListener('click',function(e){
    const button=e.target.closest?.('[data-card-view]');
    if(!button)return;
    if(button.dataset.viewHandled==='1')return;
    e.preventDefault();
    e.stopPropagation();
    button.dataset.viewHandled='1';
    button.click();
    setTimeout(()=>{button.dataset.viewHandled='0'},0);
  },true);
})();
