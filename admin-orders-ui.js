/* Admin Orders UI — restored Pending / History / All / Hidden / receipt controls. */
(() => {
  if (window.__ANTENEH_ADMIN_ORDERS_UI__) return;
  window.__ANTENEH_ADMIN_ORDERS_UI__ = true;
  const $ = id => document.getElementById(id), C = window.STORE_CONFIG || {};
  const db = window.sb || (window.supabase && C.SUPABASE_URL && C.SUPABASE_PUBLISHABLE_KEY ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_PUBLISHABLE_KEY) : null);
  let orders = [], books = {}, view = null, token = 0;

  const key = 'anteneh_admin_hidden_orders_v4';
  let hidden = new Set();
  try {
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const old = JSON.parse(localStorage.getItem('adminHiddenOrders') || '[]');
    hidden = new Set([...current, ...old].map(String));
  } catch (_) {}
  const save = () => localStorage.setItem(key, JSON.stringify([...hidden]));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const status = o => String(o?.status || '').toLowerCase();
  const pendingStatus = o => ['pending','payment_submitted'].includes(status(o));
  const completed = o => ['approved','rejected'].includes(status(o));

  function render() {
    const host = $('ordersAdmin');
    if (!host) return;
    const pending = orders.filter(pendingStatus);
    const done = orders.filter(completed);
    const history = done.filter(o => !hidden.has(String(o.id)));
    const hiddenOrders = done.filter(o => hidden.has(String(o.id)));
    const all = orders;

    host.replaceChildren();
    const nav = document.createElement('div');
    nav.className = 'pay-card';
    nav.innerHTML = `<div style="display:flex;flex-wrap:wrap;gap:8px">
      <button type="button" class="btn ${view==='pending'?'primary':''}" data-v="pending">⏳ Pending (${pending.length})</button>
      <button type="button" class="btn ${view==='history'?'primary':''}" data-v="history">📁 History (${history.length})</button>
      <button type="button" class="btn ${view==='all'?'primary':''}" data-v="all">All (${all.length})</button>
      <button type="button" class="btn ${view==='hidden'?'primary':''}" data-v="hidden">👁️ Hidden (${hiddenOrders.length})</button>
    </div><p class="small-note">Pending shows payments waiting for review. History keeps approved and rejected orders. Hide moves a completed order to Hidden. Show again returns it to History. Nothing is deleted.</p>`;
    host.appendChild(nav);
    if (!view) return;

    const list = { pending, history, hidden: hiddenOrders, all }[view] || [];
    const wrap = document.createElement('div');
    wrap.className = 'admin-order-list';
    if (!list.length) {
      const msg = view === 'pending' ? '🎉 No pending payments.' : view === 'history' ? 'No orders in History.' : view === 'hidden' ? 'No hidden orders.' : 'No orders available.';
      wrap.innerHTML = `<div class="pay-card"><p>${msg}</p></div>`;
      host.appendChild(wrap);
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach(o => {
      const id = String(o.id), s = status(o), card = document.createElement('div');
      card.className = 'pay-card';
      card.dataset.id = id;
      card.style.margin = '10px 0';
      const action = pendingStatus(o)
        ? `<button type="button" class="btn primary" data-a="approve">Approve</button><button type="button" class="btn" data-a="reject">Reject</button>`
        : `<button type="button" class="btn" data-a="hide">${hidden.has(id) ? '↩️ Show again' : '🙈 Hide'}</button>`;
      const label = s === 'approved' ? '✅ Approved' : s === 'rejected' ? '❌ Rejected' : '⏳ Pending';
      card.innerHTML = `<strong>${esc(books[String(o.book_id)] || 'Book')}</strong>
        <span>Customer: ${esc(o.customer_name || '')}${o.customer_phone ? ' · ' + esc(o.customer_phone) : ''}</span>
        <span>${Number(o.amount || 0).toLocaleString()} ${esc(o.currency || 'ETB')} · <b>${label}</b></span>
        <span>Receipt: ${o.payment_proof_path ? `<button type="button" class="btn" data-r="${esc(o.payment_proof_path)}">📷 View receipt</button>` : 'Not uploaded'}</span>
        <small>${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</small>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">${action}</div>
        <span class="small-note" data-f></span>`;
      fragment.appendChild(card);
    });
    wrap.appendChild(fragment);
    host.appendChild(wrap);
  }

  async function load() {
    const host = $('ordersAdmin');
    if (!host) return;
    if (!db) { host.textContent = 'Admin connection could not be initialized.'; return; }
    const t = ++token;
    host.innerHTML = '<p class="small-note">Loading orders & payments…</p>';
    try {
      const [o, b] = await Promise.all([
        db.from('orders').select('id,book_id,customer_name,customer_email,customer_phone,amount,currency,status,payment_reference,payment_proof_path,created_at').order('created_at', { ascending:false }),
        db.from('books').select('id,title,is_free')
      ]);
      if (t !== token) return;
      if (o.error) { host.textContent = 'Orders could not be loaded: ' + o.error.message; return; }
      if (b.error) { host.textContent = 'Books could not be loaded: ' + b.error.message; return; }
      books = {};
      (b.data || []).forEach(book => { books[String(book.id)] = book.title; });
      orders = Array.isArray(o.data) ? o.data : [];
      const valid = new Set(orders.filter(completed).map(o => String(o.id)));
      hidden = new Set([...hidden].filter(id => valid.has(id)));
      save();
      render();
    } catch (e) {
      host.textContent = 'Orders could not be loaded: ' + (e.message || e);
    }
  }

  async function setStatus(id, next, card) {
    const feedback = card.querySelector('[data-f]');
    card.querySelectorAll('button').forEach(b => b.disabled = true);
    if (feedback) feedback.textContent = next === 'approved' ? 'Approving payment…' : 'Rejecting payment…';
    const result = await db.rpc('admin_update_order', { p_order_id:id, p_status:next });
    if (result.error) {
      if (feedback) feedback.textContent = '❌ ' + result.error.message;
      card.querySelectorAll('button').forEach(b => b.disabled = false);
      return;
    }
    await load();
  }

  async function receipt(path) {
    const result = await db.storage.from('payment-proofs').createSignedUrl(path, 600);
    if (result.error || !result.data?.signedUrl) {
      alert('Receipt could not be opened: ' + (result.error?.message || 'Unknown error'));
      return;
    }
    window.open(result.data.signedUrl, '_blank', 'noopener');
  }

  document.addEventListener('click', e => {
    const host = $('ordersAdmin');
    if (!host || !host.contains(e.target)) return;
    const tab = e.target.closest('[data-v]');
    if (tab) {
      const next = tab.dataset.v;
      view = view === next ? null : next;
      render();
      return;
    }
    const receiptButton = e.target.closest('[data-r]');
    if (receiptButton) { receipt(receiptButton.dataset.r); return; }
    const action = e.target.closest('[data-a]');
    if (!action) return;
    const card = action.closest('[data-id]');
    if (!card) return;
    const id = String(card.dataset.id);
    if (action.dataset.a === 'hide') {
      if (hidden.has(id)) { hidden.delete(id); view = 'history'; }
      else { hidden.add(id); view = 'hidden'; }
      save(); render(); return;
    }
    if (action.dataset.a === 'approve') setStatus(id, 'approved', card);
    if (action.dataset.a === 'reject') setStatus(id, 'rejected', card);
  });

  window.loadOrders = load;
  window.orderView = v => { view = view === v ? null : v; render(); };
  window.toggleHidden = id => {
    id = String(id);
    if (hidden.has(id)) { hidden.delete(id); view = 'history'; }
    else { hidden.add(id); view = 'hidden'; }
    save(); render();
  };
  setTimeout(load, 300);
})();
