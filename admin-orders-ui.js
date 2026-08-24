/* Admin Orders UI — clean single instance. Payment history contains paid orders only. Free-book access is not a payment order. */
(() => {
  if (window.__ANTENEH_ADMIN_ORDERS_UI__) return;
  window.__ANTENEH_ADMIN_ORDERS_UI__ = true;

  const $ = id => document.getElementById(id);
  let allOrders = [];
  let booksBy = {};
  let currentView = 'pending';
  let loadToken = 0;

  const hiddenKey = 'anteneh_admin_hidden_paid_orders_v3';
  let hiddenIds = new Set();
  try { hiddenIds = new Set(JSON.parse(localStorage.getItem(hiddenKey) || '[]').map(String)); } catch (_) {}
  const persistHidden = () => localStorage.setItem(hiddenKey, JSON.stringify([...hiddenIds]));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const statusOf = o => String(o?.status || '').trim().toLowerCase();
  const completed = o => ['approved','rejected'].includes(statusOf(o));

  function lists() {
    const pending = allOrders.filter(o => statusOf(o) === 'pending');
    const completedOrders = allOrders.filter(completed);
    const history = completedOrders.filter(o => !hiddenIds.has(String(o.id)));
    const hidden = completedOrders.filter(o => hiddenIds.has(String(o.id)));
    const visibleAll = allOrders.filter(o => !hiddenIds.has(String(o.id)));
    return { pending, history, hidden, visibleAll };
  }

  function render() {
    const host = $('ordersAdmin');
    if (!host) return;
    const {pending, history, hidden, visibleAll} = lists();
    const map = {pending, history, hidden, all: visibleAll};
    const list = map[currentView] || pending;
    host.replaceChildren();

    const controls = document.createElement('div');
    controls.className = 'pay-card admin-order-controls';
    controls.style.cssText = 'margin:10px 0;padding:14px';
    controls.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
        <button type="button" class="btn ${currentView==='pending'?'primary':''}" data-order-view="pending">⏳ Pending (${pending.length})</button>
        <button type="button" class="btn ${currentView==='history'?'primary':''}" data-order-view="history">📁 History (${history.length})</button>
        <button type="button" class="btn ${currentView==='all'?'primary':''}" data-order-view="all">All (${visibleAll.length})</button>
        <button type="button" class="btn ${currentView==='hidden'?'primary':''}" data-order-view="hidden">👁️ Hidden (${hidden.length})</button>
      </div>
      <p class="small-note" style="margin:10px 0 0">Approved and rejected paid orders stay in History. Hide moves a paid order to Hidden. Show again returns it to History. Nothing is deleted.</p>`;
    host.appendChild(controls);

    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'pay-card';
      empty.style.margin = '10px 0';
      empty.innerHTML = `<p>${currentView==='pending' ? '🎉 No pending orders.' : currentView==='hidden' ? 'No hidden paid orders.' : 'No orders in this view.'}</p>`;
      host.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(o => {
      const id = String(o.id);
      const status = statusOf(o);
      const isPending = status === 'pending';
      const isHidden = hiddenIds.has(id);
      const card = document.createElement('div');
      card.className = 'pay-card admin-order-card';
      card.style.margin = '10px 0';
      const statusText = status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending';
      const icon = status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      card.dataset.orderId = id;
      card.innerHTML = `
        <strong>${esc(booksBy[String(o.book_id)] || 'Book')}</strong>
        <span>Customer: ${esc(o.customer_name || '')}${o.customer_phone ? ' · ' + esc(o.customer_phone) : ''}</span>
        <span>${Number(o.amount || 0).toLocaleString()} ${esc(o.currency || 'ETB')} · <b>${icon} ${statusText}</b></span>
        <span>Receipt: ${o.payment_proof_path ? '<button type="button" class="btn" data-receipt="'+esc(o.payment_proof_path)+'">📷 View receipt</button>' : 'Not uploaded'}</span>
        <small>${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</small>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
          ${isPending ? '<button type="button" class="btn primary" data-order-action="approve">Approve</button><button type="button" class="btn" data-order-action="reject">Reject</button>' : '<button type="button" class="btn" data-order-action="toggle-hidden">'+(isHidden ? '↩️ Show again' : '🙈 Hide')+'</button>'}
        </div>
        <span class="small-note" data-feedback></span>`;
      frag.appendChild(card);
    });
    host.appendChild(frag);
  }

  async function loadOrders() {
    const host = $('ordersAdmin');
    if (!host || !window.sb) return;
    const token = ++loadToken;
    host.dataset.loading = '1';
    try {
      const [ordersResult, booksResult] = await Promise.all([
        sb.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at',{ascending:false}),
        sb.from('books').select('id,title,is_free')
      ]);
      if (token !== loadToken) return;
      if (ordersResult.error) { host.textContent = ordersResult.error.message; return; }
      if (booksResult.error) { host.textContent = booksResult.error.message; return; }

      booksBy = {};
      const paidBookIds = new Set();
      (booksResult.data || []).forEach(b => {
        const id = String(b.id);
        booksBy[id] = b.title;
        if (!b.is_free) paidBookIds.add(id);
      });

      // Free-book reader access is not a payment order and must not appear here.
      allOrders = (ordersResult.data || []).filter(o => paidBookIds.has(String(o.book_id)));

      // Drop stale hidden IDs and IDs that belong to free-book access records.
      const validHidden = new Set(allOrders.filter(completed).map(o => String(o.id)));
      hiddenIds = new Set([...hiddenIds].filter(id => validHidden.has(String(id))));
      persistHidden();

      render();
    } finally {
      if (token === loadToken) delete host.dataset.loading;
    }
  }

  async function setOrder(id,status,card) {
    const feedback = card?.querySelector('[data-feedback]');
    const buttons = card?.querySelectorAll('button') || [];
    buttons.forEach(b => b.disabled = true);
    if (feedback) feedback.textContent = status==='approved' ? 'Approving payment…' : 'Rejecting payment…';
    const {error}=await sb.rpc('admin_update_order',{p_order_id:id,p_status:status});
    if(error){if(feedback)feedback.textContent='❌ '+error.message;buttons.forEach(b=>b.disabled=false);return;}
    await loadOrders();
  }

  async function viewReceipt(path) {
    if(!path)return;
    const {data,error}=await sb.storage.from('payment-proofs').createSignedUrl(path,600);
    if(error||!data?.signedUrl){alert('Receipt could not be opened: '+(error?.message||'Unknown error'));return;}
    window.open(data.signedUrl,'_blank','noopener');
  }

  function clickHandler(event) {
    const host=$('ordersAdmin');
    if(!host||!host.contains(event.target))return;
    const viewButton=event.target.closest('[data-order-view]');
    if(viewButton){event.preventDefault();currentView=viewButton.dataset.orderView;render();return;}
    const receipt=event.target.closest('[data-receipt]');
    if(receipt){event.preventDefault();viewReceipt(receipt.dataset.receipt);return;}
    const action=event.target.closest('[data-order-action]');
    if(!action)return;
    event.preventDefault();
    const card=action.closest('[data-order-id]');
    if(!card)return;
    const id=String(card.dataset.orderId);
    if(action.dataset.orderAction==='toggle-hidden'){
      if(hiddenIds.has(id)){hiddenIds.delete(id);currentView='history';}
      else{hiddenIds.add(id);currentView='hidden';}
      persistHidden();render();return;
    }
    if(action.dataset.orderAction==='approve')setOrder(id,'approved',card);
    if(action.dataset.orderAction==='reject')setOrder(id,'rejected',card);
  }

  document.addEventListener('click',clickHandler);
  window.orderView=v=>{currentView=v;render();};
  window.toggleHidden=id=>{const key=String(id);if(hiddenIds.has(key)){hiddenIds.delete(key);currentView='history';}else{hiddenIds.add(key);currentView='hidden';}persistHidden();render();};
  window.loadOrders=loadOrders;
  setTimeout(loadOrders,0);
})();