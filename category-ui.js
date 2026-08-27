(function(){
  const C=window.STORE_CONFIG||{};
  let sb=null;
  const holyLabel='✝️ Holy Books';
  const paidLabel='💳 Paid Books';
  const freeLabel='🆓 Free Books';

  function styles(){
    if(document.getElementById('category-ui-style'))return;
    const s=document.createElement('style');s.id='category-ui-style';s.textContent=`
      .book-category-section{margin:0 0 34px;padding:0}
      .book-category-section .category-heading{display:flex;align-items:center;gap:10px;margin:0 0 14px;padding:0 2px}
      .book-category-section .category-heading h2{margin:0;font-size:clamp(20px,3vw,28px);line-height:1.2}
      .book-category-section .category-heading .category-mark{font-size:24px}
      #holyBooksGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;align-items:start}
      #holyBooksGrid .book{min-width:0;margin:0;border:1px solid var(--line);border-top:3px solid var(--green);border-radius:16px;background:#fff;box-shadow:0 6px 18px #2f1f120c;overflow:hidden}
      #holyBooksGrid .book:nth-child(3n+2){border-top-color:var(--gold)}#holyBooksGrid .book:nth-child(3n){border-top-color:var(--red)}
      #holyBooksGrid .book .cover,#holyBooksGrid .book .badge,#holyBooksGrid .book .bottom{display:none!important}
      #holyBooksGrid .book .body{padding:0!important}
      #holyBooksGrid .book .title{margin:0;padding:13px 14px;min-height:58px;display:flex;align-items:center;cursor:pointer;font-size:16px;line-height:1.3;font-weight:700;overflow-wrap:anywhere}
      #holyBooksGrid .book.expanded{grid-column:1/-1}
      #holyBooksGrid .book .book-preview{padding:14px}
      #holyBooksGrid .book .book-preview[hidden]{display:none!important}
      #holyBooksGrid .book .book-view-button{display:inline-flex!important;width:auto!important;min-width:120px}
      .holy-category-note{margin:0 0 16px;color:var(--muted);font-size:14px;line-height:1.45}
      .admin-category{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 18px;padding:10px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(90deg,#168a4b0a,#f0c4190a,#c83c320a)}
      .admin-category label{margin:0;font-weight:700;flex:1;min-width:180px}.admin-category select{margin-top:5px}
      .admin-category-note{font-size:12px;color:var(--muted);width:100%;margin:0}
      @media(max-width:900px){#holyBooksGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}
      @media(max-width:520px){#holyBooksGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#holyBooksGrid .book{border-radius:14px}#holyBooksGrid .book .title{font-size:14px;padding:11px 10px;min-height:52px}#holyBooksGrid .book .book-preview{padding:11px}}
    `;document.head.appendChild(s)
  }

  async function customer(){
    if(!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY)return;
    sb=window.supabase?.createClient?.(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);if(!sb)return;
    styles();
    const books=document.querySelector('#books'), grid=document.querySelector('#grid'), free=document.querySelector('#freeGrid');if(!books||!grid||!free)return;
    let rows=[];try{const r=await sb.from('books').select('id,category,is_free').eq('is_published',true);if(!r.error)rows=r.data||[]}catch(e){return}
    const categories=new Map(rows.map(x=>[String(x.id),x.category||((x.is_free)?'free':'paid')]));
    let section=document.getElementById('holyBooksSection');
    if(!section){section=document.createElement('section');section.id='holyBooksSection';section.className='book-category-section';section.innerHTML='<div class="container"><div class="category-heading"><span class="category-mark">✝️</span><h2>Holy Books</h2></div><p class="holy-category-note">Free Ethiopian Orthodox Tewahedo Christian books, kept separate from ordinary free books.</p><div id="holyBooksGrid"></div></div>';books.parentNode.insertBefore(section,books)}
    const holyGrid=document.getElementById('holyBooksGrid');
    function move(){
      if(!holyGrid)return;
      Array.from(free.querySelectorAll('.book')).forEach(card=>{const id=card.getAttribute('data-book-card');if(categories.get(String(id))==='holy')holyGrid.appendChild(card)});
      Array.from(grid.querySelectorAll('.book')).forEach(card=>{const id=card.getAttribute('data-book-card');if(categories.get(String(id))==='holy')holyGrid.appendChild(card)});
      holyGrid.querySelectorAll('.book').forEach(c=>c.classList.add('holy-book'));
      if(holyGrid.children.length===0)section.hidden=true;else section.hidden=false;
    }
    const observer=new MutationObserver(()=>move());observer.observe(grid,{childList:true,subtree:true});observer.observe(free,{childList:true,subtree:true});
    move();
  }

  function admin(){
    if(!window.supabase||!C.SUPABASE_URL||!C.SUPABASE_PUBLISHABLE_KEY)return;
    sb=window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY);styles();
    const form=document.getElementById('bookForm');if(!form||document.getElementById('bookCategory'))return;
    const wrap=document.createElement('div');wrap.className='admin-category';wrap.innerHTML='<label>Book category<select id="bookCategory"><option value="paid">💳 Paid Books</option><option value="holy">✝️ Holy Books — Free</option><option value="free">🆓 Free Books</option></select></label><p class="admin-category-note">Holy Books are free but remain in their own separate category.</p>';
    const mode=document.querySelector('.product-modes');mode?.insertAdjacentElement('beforebegin',wrap);
    const select=document.getElementById('bookCategory'), oldSubmit=form.onsubmit;
    form.onsubmit=async function(e){
      const category=select.value;
      const title=document.getElementById('title')?.value.trim();
      const existingId=document.getElementById('bookId')?.value||null;
      if(category==='holy'||category==='free'){document.getElementById('free').checked=true;document.getElementById('price').value='0'}
      else {document.getElementById('free').checked=false}
      const result=oldSubmit?oldSubmit.call(form,e):null;
      if(result&&typeof result.then==='function')await result;
      await new Promise(r=>setTimeout(r,350));
      try{
        let id=existingId;
        if(!id&&title){const q=await sb.from('books').select('id,created_at').eq('title',title).order('created_at',{ascending:false}).limit(1).maybeSingle();id=q.data?.id||null}
        if(id)await sb.rpc('admin_set_book_category',{p_id:id,p_category:category});
      }catch(err){console.error('Category save failed',err)}
      loadAdminCategory(existingId);
    };
    async function loadAdminCategory(id){
      if(!id)return;
      try{const q=await sb.from('books').select('category,is_free').eq('id',id).single();if(q.data)select.value=q.data.category|| (q.data.is_free?'free':'paid')}catch(e){}
    }
    setInterval(()=>{const id=document.getElementById('bookId')?.value||'';if(id&&select.dataset.lastId!==id){select.dataset.lastId=id;loadAdminCategory(id)}},700);
    document.getElementById('reset')?.addEventListener('click',()=>{select.value='paid';select.dataset.lastId=''});
  }

  function init(){customer();admin()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
