/* Admin Orders UI — restored Pending / History / All / Hidden / receipt controls. */
(() => {
  if (window.__ANTENEH_ADMIN_ORDERS_UI__) return;
  window.__ANTENEH_ADMIN_ORDERS_UI__ = true;
  const $ = id => document.getElementById(id), C = window.STORE_CONFIG || {};
  const db = window.sb || (window.supabase && C.SUPABASE_URL && C.SUPABASE_PUBLISHABLE_KEY ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY) : null);
  let orders = [], books = {}, view = null, token = 0;
  const key = 'anteneh_admin_hidden_orders_v4';
  let hidden = new Set();
  try { hidden = new Set([...(JSON.parse(localStorage.getItem(key)||'[]')), ...(JSON.parse(localStorage.getItem('adminHiddenOrders')||'[]'))].map(String)); } catch (_) {}
  const save = () => localStorage.setItem(key, JSON.stringify([...hidden]));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const status = o => String(o?.status || '').toLowerCase();
  const pendingStatus = o => ['pending','payment_submitted'].includes(status(o));
  const completed = o => ['approved','rejected'].includes(status(o));
  function render(){
    const host=$('ordersAdmin'); if(!host)return;
    const pending=orders.filter(pendingStatus), done=orders.filter(completed), history=done.filter(o=>!hidden.has(String(o.id))), hiddenOrders=done.filter(o=>hidden.has(String(o.id))), all=orders;
    host.replaceChildren();
    const nav=document.createElement('div'); nav.className='pay-card';
    nav.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn ${view==='pending'?'primary':''}" data-v="pending">⏳ Pending (${pending.length})</button><button type="button" class="btn ${view==='history'?'primary':''}" data-v="history">📁 History (${history.length})</button><button type="button" class="btn ${view==='all'?'primary':''}" data-v="all">All (${all.length})</button><button type="button" class="btn ${view==='hidden'?'primary':''}" data-v="hidden">👁️ Hidden (${hiddenOrders.length})</button></div><p class="small-note">Pending shows payments waiting for review. History keeps approved and rejected orders. Hide moves a completed order to Hidden. Show again returns it to History. Nothing is deleted.</p>`;
    host.appendChild(nav); if(!view)return;
    const list={pending,history,hidden:hiddenOrders,all}[view]||[], wrap=document.createElement('div'); wrap.className='admin-order-list';
    if(!list.length){wrap.innerHTML=`<div class="pay-card"><p>${view==='pending'?'🎉 No pending payments.':view==='history'?'No orders in History.':view==='hidden'?'No hidden orders.':'No orders available.'}</p></div>`;host.appendChild(wrap);return;}
    const frag=document.createDocumentFragment();
    list.forEach(o=>{const id=String(o.id),s=status(o),card=document.createElement('div');card.className='pay-card';card.dataset.id=id;card.style.margin='10px 0';const action=pendingStatus(o)?'<button type="button" class="btn primary" data-a="approve">Approve</button><button type="button" class="btn" data-a="reject">Reject</button>':`<button type="button" class="btn" data-a="hide">${hidden.has(id)?'↩️ Show again':'🙈 Hide'}</button>`;const label=s==='approved'?'✅ Approved':s==='rejected'?'❌ Rejected':'⏳ Pending';card.innerHTML=`<strong>${esc(books[String(o.book_id)]||'Book')}</strong><span>Customer: ${esc(o.customer_name||'')}${o.customer_phone?' · '+esc(o.customer_phone):''}</span><span>${Number(o.amount||0).toLocaleString()} ${esc(o.currency||'ETB')} · <b>${label}</b></span><span>Receipt: ${o.payment_proof_path?`<button type="button" class="btn" data-r="${esc(o.payment_proof_path)}">📷 View receipt</button>`:'Not uploaded'}</span><small>${o.created_at?new Date(o.created_at).toLocaleString():''}</small><div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${action}</div><span class="small-note" data-f></span>`;frag.appendChild(card);});
    wrap.appendChild(frag);host.appendChild(wrap);
  }
  async function load(){const host=$('ordersAdmin');if(!host)return;if(!db){host.textContent='Admin connection could not be initialized.';return}const t=++token;host.innerHTML='<p class="small-note">Loading orders & payments…</p>';try{const [o,b]=await Promise.all([db.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false}),db.from('books').select('id,title,is_free')]);if(t!==token)return;if(o.error){host.textContent='Orders could not be loaded: '+o.error.message;return}if(b.error){host.textContent='Books could not be loaded: '+b.error.message;return}books={};(b.data||[]).forEach(book=>books[String(book.id)]=book.title);orders=Array.isArray(o.data)?o.data:[];const valid=new Set(orders.filter(completed).map(o=>String(o.id)));hidden=new Set([...hidden].filter(id=>valid.has(id)));save();render();}catch(e){host.textContent='Orders could not be loaded: '+(e.message||e)}}
  async function setStatus(id,next,card){const f=card.querySelector('[data-f]');card.querySelectorAll('button').forEach(b=>b.disabled=true);if(f)f.textContent=next==='approved'?'Approving payment…':'Rejecting payment…';const r=await db.rpc('admin_update_order',{p_order_id:id,p_status:next});if(r.error){if(f)f.textContent='❌ '+r.error.message;card.querySelectorAll('button').forEach(b=>b.disabled=false);return}await load()}
  async function receipt(path){const r=await db.storage.from('payment-proofs').createSignedUrl(path,600);if(r.error||!r.data?.signedUrl){alert('Receipt could not be opened: '+(r.error?.message||'Unknown error'));return}window.open(r.data.signedUrl,'_blank','noopener')}
  document.addEventListener('click',e=>{const host=$('ordersAdmin');if(!host||!host.contains(e.target))return;const tab=e.target.closest('[data-v]');if(tab){const next=tab.dataset.v;view=view===next?null:next;render();return}const rb=e.target.closest('[data-r]');if(rb){receipt(rb.dataset.r);return}const a=e.target.closest('[data-a]');if(!a)return;const card=a.closest('[data-id]');if(!card)return;const id=String(card.dataset.id);if(a.dataset.a==='hide'){if(hidden.has(id)){hidden.delete(id);view='history'}else{hidden.add(id);view='hidden'}save();render();return}if(a.dataset.a==='approve')setStatus(id,'approved',card);if(a.dataset.a==='reject')setStatus(id,'rejected',card)});
  window.loadOrders=load; window.orderView=v=>{view=view===v?null:v;render()}; window.toggleHidden=id=>{id=String(id);if(hidden.has(id)){hidden.delete(id);view='history'}else{hidden.add(id);view='hidden'}save();render()}; setTimeout(load,300);
})();

/* Catalogue: title-only collapsed cards. One open at a time. */
(() => {
  if(window.__ANTENEH_CATALOGUE_TITLE_UI__) return;
  window.__ANTENEH_CATALOGUE_TITLE_UI__=true;
  const style=document.createElement('style'); style.textContent=`
    #booksAdmin{--cat-green:#168a4b;--cat-gold:#f0c419;--cat-red:#c83c32}
    #booksAdmin>h3{color:var(--cat-green);margin-bottom:14px}
    #booksAdmin .pay-card[data-cat-card]{display:grid;grid-template-columns:1fr;gap:8px;margin:10px 0!important;padding:0!important;border:1px solid #e5ddd2;border-top:4px solid var(--cat-green);border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 5px 16px #2f1f1210}
    #booksAdmin .pay-card[data-cat-card]:nth-child(3n){border-top-color:var(--cat-red)}
    #booksAdmin .pay-card[data-cat-card]:nth-child(3n+2){border-top-color:var(--cat-gold)}
    #booksAdmin .catalogue-title{display:block!important;width:100%;padding:16px 18px!important;margin:0!important;font-size:18px!important;font-weight:800!important;line-height:1.35!important;cursor:pointer!important;background:#fff!important}
    #booksAdmin .catalogue-title:hover{background:linear-gradient(90deg,#168a4b0d,#f0c4190d,#c83c320d)!important}
    #booksAdmin .catalogue-details{padding:0 16px 16px!important}
    #booksAdmin .catalogue-details[hidden]{display:none!important}
    #booksAdmin .catalogue-meta{display:block!important;margin-bottom:8px!important}
    #booksAdmin .catalogue-details .btn{margin:5px 5px 0 0!important}
    @media(min-width:901px){#booksAdmin{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}#booksAdmin>h3{grid-column:1/-1}#booksAdmin .pay-card[data-cat-card].cat-open{grid-column:1/-1}}
    @media(max-width:900px){#booksAdmin{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}#booksAdmin>h3{grid-column:1/-1}#booksAdmin .pay-card[data-cat-card].cat-open{grid-column:1/-1}}
  `; document.head.appendChild(style);
  function enhance(){const root=document.getElementById('booksAdmin');if(!root)return;root.querySelectorAll('.pay-card').forEach(card=>{if(card.dataset.catCard)return;const title=card.querySelector(':scope > b');if(!title)return;const rest=[...card.children].filter(x=>x!==title);const details=document.createElement('div');details.className='catalogue-details';details.hidden=true;details.append(...rest);card.appendChild(details);card.dataset.catCard='1';title.classList.add('catalogue-title');title.setAttribute('role','button');title.setAttribute('tabindex','0');const toggle=()=>{const opening=details.hidden;root.querySelectorAll('.pay-card[data-cat-card].cat-open').forEach(other=>{if(other!==card){other.classList.remove('cat-open');const d=other.querySelector('.catalogue-details');if(d)d.hidden=true}});details.hidden=!opening;card.classList.toggle('cat-open',opening)};title.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggle()});title.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle()}})})}
  const root=document.getElementById('booksAdmin'); if(root)new MutationObserver(enhance).observe(root,{childList:true,subtree:true}); enhance();
})();
