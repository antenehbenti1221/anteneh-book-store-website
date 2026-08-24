/* Admin order list: pending stays active; completed orders can be hidden from this admin view without deleting history. */
(() => {
  const $ = id => document.getElementById(id);
  let allOrders = [];
  let booksBy = {};
  let view = 'pending';
  const hidden = new Set(JSON.parse(localStorage.getItem('adminHiddenOrders') || '[]'));
  const saveHidden = () => localStorage.setItem('adminHiddenOrders', JSON.stringify([...hidden]));
  const esc2 = s => String(s ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&#039;'}[x]));

  function renderOrders() {
    const host = $('ordersAdmin');
    if (!host) return;
    const pending = allOrders.filter(o => o.status === 'pending');
    const approved = allOrders.filter(o => o.status === 'approved');
    const rejected = allOrders.filter(o => o.status === 'rejected');
    const archived = approved.concat(rejected);
    let list = view === 'pending' ? pending : view === 'archived' ? archived.filter(o => !hidden.has(o.id)) : view === 'all' ? allOrders.filter(o => !hidden.has(o.id)) : archived;

    host.innerHTML = `<div class="pay-card" style="margin:10px 0;padding:14px"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center"><button class="btn ${view==='pending'?'primary':''}" onclick="orderView('pending')">⏳ Pending (${pending.length})</button><button class="btn ${view==='archived'?'primary':''}" onclick="orderView('archived')">📁 History (${archived.filter(o=>!hidden.has(o.id)).length})</button><button class="btn ${view==='all'?'primary':''}" onclick="orderView('all')">All (${allOrders.filter(o=>!hidden.has(o.id)).length})</button><button class="btn ${view==='hidden'?'primary':''}" onclick="orderView('hidden')">👁️ Hidden (${archived.filter(o=>hidden.has(o.id)).length})</button></div><p class="small-note" style="margin:10px 0 0">Approved and rejected orders move to History. Hide removes an item from normal admin views only; it is never deleted.</p></div>`;

    if (view === 'hidden') list = archived.filter(o => hidden.has(o.id));
    if (!list.length) { host.innerHTML += `<div class="pay-card" style="margin:10px 0"><p>${view==='pending'?'🎉 No pending orders. You are all caught up.':view==='hidden'?'No hidden orders.':'No orders in this view.'}</p></div>`; return; }

    host.innerHTML += list.map(o => {
      const status = String(o.status || '').toLowerCase();
      const isPending = status === 'pending';
      const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
      const statusIcon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      const isHidden = hidden.has(o.id);
      return `<div class="pay-card" style="margin:10px 0"><strong>${esc2(booksBy[o.book_id] || 'Book')}</strong><span>Customer: ${esc2(o.customer_name)} · ${esc2(o.customer_phone)}</span><span>${Number(o.amount).toLocaleString()} ${esc2(o.currency)} · <b>${statusIcon} ${statusText}</b></span><span>Receipt: ${o.payment_proof_path ? `<button class="btn" onclick="viewProof('${esc2(o.payment_proof_path)}')">📷 View receipt</button>` : 'Not uploaded'}</span><small>${new Date(o.created_at).toLocaleString()}</small>${isPending ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn primary" onclick="setOrder('${o.id}','approved')">Approve</button><button class="btn" onclick="setOrder('${o.id}','rejected')">Reject</button></div>` : `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"><button class="btn" onclick="toggleHidden('${o.id}')">${isHidden ? '↩️ Show again' : '🙈 Hide'}</button></div>`}<span id="order-feedback-${o.id}" class="small-note"></span></div>`;
    }).join('');
  }

  window.orderView = v => { view = v; renderOrders(); };
  window.toggleHidden = id => { if (hidden.has(id)) hidden.delete(id); else hidden.add(id); saveHidden(); renderOrders(); };

  window.loadOrders = async function() {
    const host = $('ordersAdmin'); if (!host) return; host.innerHTML = 'Loading…';
    const {data, error} = await sb.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false});
    if (error) { host.textContent = error.message; return; }
    const b = (await sb.from('books').select('id,title')).data || []; booksBy = {}; b.forEach(x => booksBy[x.id] = x.title); allOrders = data || []; renderOrders();
  };

  window.setOrder = async (id,status) => {
    const feedback = $('order-feedback-'+id); const buttons = document.querySelectorAll(`button[onclick*="setOrder('${id}'"]`); buttons.forEach(b=>b.disabled=true); if(feedback) feedback.textContent=status==='approved'?'Approving payment…':'Rejecting payment…';
    const {error}=await sb.rpc('admin_update_order',{p_order_id:id,p_status:status});
    if(error){if(feedback)feedback.textContent='❌ '+error.message;buttons.forEach(b=>b.disabled=false);return;}
    if(feedback)feedback.textContent=status==='approved'?'✅ Payment approved — moved to History.':'✅ Payment rejected — moved to History.'; setTimeout(()=>window.loadOrders(),500);
  };

  setTimeout(()=>window.loadOrders(),0);
})();

/* Small admin UI polish: catalogue cards collapse to title-only, and product publishing choices are clearer. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    #booksAdmin .catalogue-item-title{display:block;width:100%;padding:18px 20px;border:0;background:transparent;text-align:left;font:inherit;font-weight:700;font-size:1.08rem;cursor:pointer;color:inherit}
    #booksAdmin .catalogue-item-title:after{content:'⌄';float:right;opacity:.55;transition:transform .18s ease}
    #booksAdmin .catalogue-item-title[aria-expanded="true"]:after{transform:rotate(180deg)}
    #booksAdmin .catalogue-item{overflow:hidden}
    #booksAdmin .catalogue-item-details{display:none;padding:0 20px 18px}
    #booksAdmin .catalogue-item.open .catalogue-item-details{display:block}
    #bookPublishChoices{margin:14px 0 18px}
    #bookPublishChoices .choice-heading{font-weight:700;margin-bottom:10px}
    #bookPublishChoices .free-choice{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border:1px solid rgba(22,138,75,.22);border-radius:18px;background:rgba(22,138,75,.06);cursor:pointer;box-sizing:border-box}
    #bookPublishChoices .free-choice.active{border-color:#168a4b;background:rgba(22,138,75,.12)}
    #bookPublishChoices .free-icon{font-size:1.7rem}
    #bookPublishChoices .type-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}
    #bookPublishChoices .type-choice{display:flex;align-items:center;justify-content:center;gap:8px;padding:14px 10px;border:1px solid #e4ddd4;border-radius:16px;background:#fff;cursor:pointer;font-weight:700}
    #bookPublishChoices .type-choice.active{border-color:#b13d2c;box-shadow:0 0 0 2px rgba(177,61,44,.08);background:rgba(177,61,44,.06)}
    @media(max-width:520px){#bookPublishChoices .type-row{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function polishCatalogue() {
    const host = document.getElementById('booksAdmin');
    if (!host) return;
    host.querySelectorAll(':scope > .pay-card').forEach(card => {
      if (card.dataset.cataloguePolished === '1') return;
      const title = card.querySelector(':scope > b');
      if (!title) return;
      card.dataset.cataloguePolished = '1';
      card.classList.add('catalogue-item');
      const details = document.createElement('div');
      details.className = 'catalogue-item-details';
      while (title.nextSibling) details.appendChild(title.nextSibling);
      const titleButton = document.createElement('button');
      titleButton.type = 'button';
      titleButton.className = 'catalogue-item-title';
      titleButton.textContent = title.textContent || '';
      titleButton.setAttribute('aria-expanded','false');
      title.replaceWith(titleButton);
      card.appendChild(details);
      titleButton.addEventListener('click', () => {
        const open = card.classList.contains('open');
        host.querySelectorAll('.catalogue-item.open').forEach(other => {
          if (other !== card) {
            other.classList.remove('open');
            const t = other.querySelector('.catalogue-item-title');
            if (t) t.setAttribute('aria-expanded','false');
          }
        });
        card.classList.toggle('open', !open);
        titleButton.setAttribute('aria-expanded', String(!open));
      });
    });
  }

  function polishPublishForm() {
    const form = document.getElementById('bookForm');
    const free = document.getElementById('free');
    const type = document.getElementById('type');
    if (!form || !free || !type || document.getElementById('bookPublishChoices')) return;
    const freeLabel = free.closest('label');
    const typeLabel = type.closest('label');
    const block = document.createElement('div');
    block.id = 'bookPublishChoices';
    block.innerHTML = `<div class="choice-heading">📚 Book access</div><label class="free-choice"><span class="free-icon">🆓</span><span><b>Free Books</b><br><small>No payment required</small></span></label><div class="type-row"><button type="button" class="type-choice" data-type="Ebook">📕 Ebook</button><button type="button" class="type-choice" data-type="Audiobook">🎧 Audiobook</button></div>`;
    const freeChoice = block.querySelector('.free-choice');
    freeChoice.addEventListener('click', () => { free.checked = !free.checked; free.dispatchEvent(new Event('change',{bubbles:true})); sync(); });
    block.querySelectorAll('.type-choice').forEach(btn => btn.addEventListener('click', () => { type.value = btn.dataset.type; type.dispatchEvent(new Event('change',{bubbles:true})); sync(); }));
    (freeLabel || typeLabel)?.before(block);
    if (freeLabel) freeLabel.style.display='none';
    if (typeLabel) typeLabel.style.display='none';
    function sync(){
      freeChoice.classList.toggle('active', free.checked);
      block.querySelectorAll('.type-choice').forEach(btn => btn.classList.toggle('active', btn.dataset.type===type.value));
    }
    sync();
  }

  const boot = () => { polishCatalogue(); polishPublishForm(); };
  setTimeout(boot, 0);
  const catalogueObserver = new MutationObserver(polishCatalogue);
  setTimeout(() => { const host=document.getElementById('booksAdmin'); if(host) catalogueObserver.observe(host,{childList:true,subtree:true}); }, 0);
})();
