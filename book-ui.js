(function(){
  const style=document.createElement('style');
  style.id='book-ui-exact';
  style.textContent=`
    /* FREE BOOKS ONLY: keep title cards clean and expandable. */
    #freeGrid .book{min-width:0!important;overflow:hidden!important}
    #freeGrid .book .cover,#freeGrid .book .badge{display:none!important}
    #freeGrid .book .body{padding:0!important}
    #freeGrid .book .title{margin:0!important;padding:13px 14px!important;min-height:58px!important;display:flex!important;align-items:center!important;cursor:pointer!important;font-size:16px!important;line-height:1.3!important;font-weight:700!important;overflow-wrap:anywhere!important}
    #freeGrid .book .book-preview{padding:14px!important}
    #freeGrid .book .book-preview[hidden]{display:none!important}
    #freeGrid .book .book-preview .desc{min-height:0!important;margin:0 0 10px!important;white-space:pre-wrap!important;overflow-wrap:anywhere!important}
    #freeGrid .book .bottom{display:none!important}
    #freeGrid .book .book-view-button{display:inline-flex!important;position:relative!important;z-index:2!important;pointer-events:auto!important;cursor:pointer!important}
    #freeGrid .book.expanded{grid-column:1/-1!important}
    @media(max-width:520px){#freeGrid .book .title{font-size:14px!important;padding:11px 10px!important;min-height:52px!important}#freeGrid .book .book-preview{padding:11px!important}}
  `;
  document.head.appendChild(style);
  function collapse(scope,except){scope.querySelectorAll('.book.expanded').forEach(other=>{if(other!==except){other.classList.remove('expanded');const p=other.querySelector('.book-preview');if(p)p.hidden=true;}})}
  function wireFreeTitle(card,preview,scope){const title=card.querySelector('.title');if(!title||!preview)return;const toggle=()=>{const opening=!card.classList.contains('expanded');collapse(scope,card);card.classList.toggle('expanded',opening);preview.hidden=!opening};title.setAttribute('role','button');title.setAttribute('tabindex','0');title.onclick=e=>{e.preventDefault();e.stopPropagation();toggle()};title.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}}}
  function moveFreeAction(card,preview){const old=card.querySelector('[data-card-view]');if(old&&!old.dataset.freeActionMoved){old.dataset.freeActionMoved='1';old.classList.add('book-view-button');old.type='button';preview.appendChild(old)}}
  function enhanceFree(){const scope=document.querySelector('#freeGrid');if(!scope)return;scope.querySelectorAll('.book').forEach(card=>{const preview=card.querySelector('.book-preview');if(!preview||card.dataset.freeUiReady)return;card.dataset.freeUiReady='1';preview.hidden=true;moveFreeAction(card,preview);wireFreeTitle(card,preview,scope)})}
  const observer=new MutationObserver(enhanceFree);observer.observe(document.body,{childList:true,subtree:true});enhanceFree();
})();
