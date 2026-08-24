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
    #adGrid .promo-image{display:flex!important;align-items:center!important;justify-content:center!important;overflow:visible!important;background:transparent!important;padding:0!important;border-radius:12px!important}
    #adGrid .promo-image img{display:block!important;width:auto!important;height:auto!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important;object-position:center!important;margin:auto!important;border-radius:0!important;box-shadow:none!important}
    #adGrid .promo-overlay{display:none!important;visibility:hidden!important}
    #adGrid .promo-action{padding:0 4px 8px}
  `;
  document.head.appendChild(style);
  function enhanceGrid(){document.querySelectorAll('#grid .book').forEach(card=>{const title=card.querySelector('.title'),preview=card.querySelector('.book-preview');if(!title||!preview||title.dataset.uiReady)return;title.dataset.uiReady='1';const old=card.querySelector('[data-card-view]');if(old){old.style.display='inline-flex';old.classList.add('book-view-button');preview.appendChild(old)}title.setAttribute('role','button');title.setAttribute('tabindex','0');const toggle=()=>{document.querySelectorAll('#grid .book.expanded').forEach(other=>{if(other!==card){other.classList.remove('expanded');const p=other.querySelector('.book-preview');if(p)p.hidden=true}});const open=card.classList.toggle('expanded');preview.hidden=!open};title.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}})})}
  function enhanceFree(){document.querySelectorAll('#freeGrid .book').forEach(card=>{const title=card.querySelector('.title'),preview=card.querySelector('.book-preview');if(!title||!preview||title.dataset.freeUiReady)return;title.dataset.freeUiReady='1';preview.hidden=true;title.setAttribute('role','button');title.setAttribute('tabindex','0')})}
  function enhance(){enhanceGrid();enhanceFree()}
  const observer=new MutationObserver(enhance);observer.observe(document.body,{childList:true,subtree:true});enhance();
})();
