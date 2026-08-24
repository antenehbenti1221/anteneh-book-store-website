/* Admin Orders UI — single instance, paid orders only. */
(() => {
  if (window.__ANTENEH_ADMIN_ORDERS_UI__) return;
  window.__ANTENEH_ADMIN_ORDERS_UI__ = true;
  const $=id=>document.getElementById(id), C=window.STORE_CONFIG||{};
  const db=window.sb || (window.supabase&&C.SUPABASE_URL&&C.SUPABASE_PUBLISHABLE_KEY ? window.supabase.createClient(C.SUPABASE_URL,C.SUPABASE_PUBLISHABLE_KEY) : null);
  let orders=[],books={},view=null,token=0;
  const key='anteneh_admin_hidden_paid_orders_v3';
  let hidden=new Set();try{hidden=new Set(JSON.parse(localStorage.getItem(key)||'[]').map(String));}catch(e){}
  const save=()=>localStorage.setItem(key,JSON.stringify([...hidden]));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const st=o=>String(o?.status||'').toLowerCase(),done=o=>['approved','rejected'].includes(st(o));
  function render(){const h=$('ordersAdmin');if(!h)return;const p=orders.filter(o=>st(o)==='pending'),d=orders.filter(done),his=d.filter(o=>!hidden.has(String(o.id))),hid=d.filter(o=>hidden.has(String(o.id))),a=orders.filter(o=>!hidden.has(String(o.id)));h.replaceChildren();const nav=document.createElement('div');nav.className='pay-card';nav.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:8px"><button type="button" class="btn ${view==='pending'?'primary':''}" data-v="pending">⏳ Pending (${p.length})</button><button type="button" class="btn ${view==='history'?'primary':''}" data-v="history">📁 History (${his.length})</button><button type="button" class="btn ${view==='all'?'primary':''}" data-v="all">All (${a.length})</button><button type="button" class="btn ${view==='hidden'?'primary':''}" data-v="hidden">👁️ Hidden (${hid.length})</button></div><p class="small-note">Approved and rejected paid orders stay in History. Hide moves a paid order to Hidden. Show again returns it to History. Nothing is deleted.</p>`;h.appendChild(nav);if(!view)return;const list={pending:p,history:his,hidden:hid,all:a}[view]||[];const wrap=document.createElement('div');wrap.className='admin-order-list';if(!list.length){wrap.innerHTML=`<div class="pay-card"><p>${view==='pending'?'🎉 No pending orders.':view==='hidden'?'No hidden paid orders.':'No orders in this view.'}</p></div>`;h.appendChild(wrap);return}const f=document.createDocumentFragment();list.forEach(o=>{const id=String(o.id),s=st(o),c=document.createElement('div');c.className='pay-card';c.dataset.id=id;c.style.margin='10px 0';c.innerHTML=`<strong>${esc(books[String(o.book_id)]||'Book')}</strong><span>Customer: ${esc(o.customer_name||'')}${o.customer_phone?' · '+esc(o.customer_phone):''}</span><span>${Number(o.amount||0).toLocaleString()} ${esc(o.currency||'ETB')} · <b>${s==='approved'?'✅ Approved':s==='rejected'?'❌ Rejected':'⏳ Pending'}</b></span><span>Receipt: ${o.payment_proof_path?`<button type="button" class="btn" data-r="${esc(o.payment_proof_path)}">📷 View receipt</button>`:'Not uploaded'}</span><small>${o.created_at?new Date(o.created_at).toLocaleString():''}</small><div style="display:flex;gap:8px;margin-top:8px">${s==='pending'?'<button type="button" class="btn primary" data-a="approve">Approve</button><button type="button" class="btn" data-a="reject">Reject</button>':`<button type="button" class="btn" data-a="hide">${hidden.has(id)?'↩️ Show again':'🙈 Hide'}</button>`}</div><span class="small-note" data-f></span>`;f.appendChild(c)});wrap.appendChild(f);h.appendChild(wrap)}
  async function load(){const h=$('ordersAdmin');if(!h)return;if(!db){h.textContent='Admin connection could not be initialized.';return}const t=++token;h.textContent='Loading…';try{const [o,b]=await Promise.all([db.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false}),db.from('books').select('id,title,is_free')]);if(t!==token)return;if(o.error){h.textContent='Orders could not be loaded: '+o.error.message;return}if(b.error){h.textContent='Books could not be loaded: '+b.error.message;return}books={};const paid=new Set();(b.data||[]).forEach(x=>{books[String(x.id)]=x.title;if(!x.is_free)paid.add(String(x.id))});orders=(o.data||[]).filter(x=>paid.has(String(x.book_id)));const valid=new Set(orders.filter(done).map(x=>String(x.id)));hidden=new Set([...hidden].filter(x=>valid.has(x)));save();render()}catch(e){h.textContent='Orders could not be loaded: '+(e.message||e)}}
  async function setStatus(id,s,c){const fb=c.querySelector('[data-f]');c.querySelectorAll('button').forEach(b=>b.disabled=true);if(fb)fb.textContent=s==='approved'?'Approving payment…':'Rejecting payment…';const r=await db.rpc('admin_update_order',{p_order_id:id,p_status:s});if(r.error){if(fb)fb.textContent='❌ '+r.error.message;c.querySelectorAll('button').forEach(b=>b.disabled=false);return}load()}
  async function receipt(path){const r=await db.storage.from('payment-proofs').createSignedUrl(path,600);if(r.error||!r.data?.signedUrl){alert('Receipt could not be opened: '+(r.error?.message||'Unknown error'));return}window.open(r.data.signedUrl,'_blank','noopener')}
  document.addEventListener('click',e=>{const h=$('ordersAdmin');if(!h||!h.contains(e.target))return;const v=e.target.closest('[data-v]');if(v){const next=v.dataset.v;view=view===next?null:next;render();return}const r=e.target.closest('[data-r]');if(r){receipt(r.dataset.r);return}const a=e.target.closest('[data-a]');if(!a)return;const c=a.closest('[data-id]');if(!c)return;const id=c.dataset.id;if(a.dataset.a==='hide'){if(hidden.has(id)){hidden.delete(id);view='history'}else{hidden.add(id);view='hidden'}save();render();return}if(a.dataset.a==='approve')setStatus(id,'approved',c);if(a.dataset.a==='reject')setStatus(id,'rejected',c)});
  window.loadOrders=load;window.orderView=v=>{view=view===v?null:v;render()};window.toggleHidden=id=>{id=String(id);if(hidden.has(id)){hidden.delete(id);view='history'}else{hidden.add(id);view='hidden'}save();render()};setTimeout(load,300);
})();

/* Admin Catalogue UI — isolated title-first accordion. */
(() => {
  if (window.__ANTENEH_ADMIN_CATALOGUE_UI__) return;
  window.__ANTENEH_ADMIN_CATALOGUE_UI__ = true;
  let observer;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function enhance() {
    const root = document.getElementById('booksAdmin');
    if (!root) return;
    const heading = [...root.children].find(x => x.tagName === 'H3' && x.textContent.trim() === 'Catalogue');
    const cards = [...root.children].filter(x => x.classList?.contains('pay-card'));
    if (!heading || !cards.length) return;
    if (root.dataset.catalogueEnhanced === '1') return;
    const items = cards.map(card => {
      const b = card.querySelector('b');
      const title = b?.textContent?.trim() || 'Untitled book';
      const spans = [...card.querySelectorAll(':scope > span')];
      const meta = spans[0]?.textContent?.trim() || '';
      const free = /\bFREE\b/i.test(meta);
      const buttons = [...card.querySelectorAll(':scope > button')].map(x => x.cloneNode(true));
      return {title, meta, free, buttons};
    });
    observer?.disconnect();
    root.dataset.catalogueEnhanced = '1';
    root.replaceChildren(heading);
    const makeSection = (label, free, icon) => {
      const section = document.createElement('section');
      section.className = 'catalogue-group';
      section.innerHTML = `<h4 style="margin:18px 0 8px;font-size:1rem">${icon} ${label}</h4>`;
      const list = document.createElement('div');
      list.className = 'catalogue-accordion-list';
      items.filter(x => x.free === free).forEach(item => {
        const row = document.createElement('article');
        row.className = 'catalogue-item';
        row.style.cssText = 'border:1px solid #e5ddd2;border-radius:14px;background:#fff;margin:8px 0;overflow:hidden;';
        const titleBtn = document.createElement('button');
        titleBtn.type = 'button';
        titleBtn.className = 'catalogue-title';
        titleBtn.style.cssText = 'width:100%;border:0;background:transparent;text-align:left;padding:14px 16px;font:inherit;font-weight:700;font-size:.98rem;cursor:pointer;display:flex;justify-content:space-between;align-items:center;';
        titleBtn.innerHTML = `<span>${esc(item.title)}</span><span aria-hidden="true">⌄</span>`;
        const details = document.createElement('div');
        details.className = 'catalogue-details';
        details.hidden = true;
        details.style.cssText = 'padding:0 16px 14px;border-top:1px solid #eee7de;';
        const meta = document.createElement('div');
        meta.className = 'small-note';
        meta.style.margin = '12px 0 8px';
        meta.textContent = item.meta;
        details.appendChild(meta);
        const actions = document.createElement('div');
        actions.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
        item.buttons.forEach(btn => actions.appendChild(btn));
        details.appendChild(actions);
        titleBtn.addEventListener('click', () => {
          const open = !details.hidden;
          document.querySelectorAll('#booksAdmin .catalogue-details').forEach(d => d.hidden = true);
          document.querySelectorAll('#booksAdmin .catalogue-title span:last-child').forEach(a => a.textContent = '⌄');
          if (!open) {
            details.hidden = false;
            titleBtn.querySelector('span:last-child').textContent = '⌃';
          }
        });
        row.append(titleBtn, details);
        list.appendChild(row);
      });
      if (!list.children.length) {
        const empty = document.createElement('p');
        empty.className = 'small-note';
        empty.textContent = `No ${label.toLowerCase()} yet.`;
        list.appendChild(empty);
      }
      section.appendChild(list);
      return section;
    };
    root.append(makeSection('Paid Books', false, '💳'), makeSection('Free Books', true, '🆓'));
    if (observer) observer.observe(root, {childList:true, subtree:true});
  }
  function resetMarker(){const root=document.getElementById('booksAdmin');if(root)root.dataset.catalogueEnhanced='0';enhance();}
  observer = new MutationObserver(() => {
    const root=document.getElementById('booksAdmin');
    if(root?.dataset.catalogueEnhanced==='1') return;
    clearTimeout(window.__ANTENEH_CATALOGUE_TIMER__);
    window.__ANTENEH_CATALOGUE_TIMER__=setTimeout(enhance,0);
  });
  const start=()=>{const root=document.getElementById('booksAdmin');if(root)observer.observe(root,{childList:true,subtree:true});enhance();};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.refreshAdminCatalogue=resetMarker;
})();